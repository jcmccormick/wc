import express, { RequestHandler, Request, Response, Express } from 'express';
import fetch from 'node-fetch';

import { useAi } from '@keybittech/wizapp/dist/server';

import {
  StrategyUser,
  ApiErrorResponse,
  siteApiRef,
  EndpointType,
  BufferResponse,
  nid,
  HttpMethodsLC,
  RedisProxy,
  RateLimitResource,
  KcSiteOpts,
  ApiSession,
} from 'awayto/core';

import { siteApiHandlerRef } from '../handlers';

import { saveFile, putFile, getFile } from '../modules/fs';

import { checkAuthenticated, validateRequestBody, rateLimit, checkToken } from '../middlewares';
import { IDatabase, ITask } from 'pg-promise';
import { Redis } from 'ioredis';
import { graylog } from 'graylog2';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

const {
  CUST_APP_HOSTNAME,
  KC_REALM,
  KC_CLIENT
} = process.env as { [prop: string]: string };

async function getGroupRegistrationRedirectParts(groupCode: string): Promise<[string, string[]]> {
  try {
    // Make a request to the Keycloak login page to retrieve the tab_id parameter
    const loginUrl = `https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}/protocol/openid-connect/auth?client_id=${KC_CLIENT}&redirect_uri=https://${CUST_APP_HOSTNAME}/app/&response_type=code&scope=openid`;
    const loginPageResponse = await fetch(loginUrl, { redirect: 'manual' });

    // Extract tab_id from response body using regex
    const html = await loginPageResponse.text();
    const match = html.match(/tab_id=([\w-]+)"/);
    const tabId = match ? match[1] : null;

    const registrationUrl = `https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}/login-actions/registration?client_id=${KC_CLIENT}&tab_id=${tabId}&group_code=${groupCode}`;
    const loginCookies = loginPageResponse.headers.raw()['set-cookie'].map(c => c.split(';')[0]);

    return [registrationUrl, loginCookies];
  } catch (error) {
    throw { reason: 'Unexpected error, try again later.' };
  }
}

export default function buildBaseRoutes(app: Express, dbClient: IDatabase<unknown>, redisClient: Redis, graylogClient: graylog, keycloakClient: KeycloakAdminClient & KcSiteOpts, redisProxy: RedisProxy, rateLimitResource: RateLimitResource): void {
  
  // Health Check
  app.get('/api/health', (req, res) => {
    res.status(200).send('OK');
  });
  
  // default protected route /test
  app.get(['/api/join', '/api/join/:groupCode'], async (req, res) => {
    if (await rateLimitResource(req.body.ipAddress, 'group/register')) {
      return res.status(429).send({ reason: 'Rate limit exceeded. Try again in a minute.' });
    }
  
    try {
      const [registrationUrl, loginCookies] = await getGroupRegistrationRedirectParts(req.params.groupCode || '');
      for (const cookie of loginCookies) {
        const [name, value] = cookie.split('=');
        res.cookie(name.trim(), value.trim());
      }
      res.set('Referrer-Policy', 'same-origin');
      res.redirect(registrationUrl);
    } catch (error) {
      res.status(500).send((error as ApiErrorResponse).reason);
    }
  });
  
  for (const apiRefId in siteApiRef) {  
  
    const { method, url, queryArg, resultType, kind, opts: { cache, throttle, contentType } } = siteApiRef[apiRefId as keyof typeof siteApiRef];
    const isFileContent = 'application/octet-stream' === contentType;
  
    const requestHandlers: RequestHandler[] = [
      rateLimit(rateLimitResource, throttle, kind, method, url),
      checkToken(dbClient, redisProxy),
      checkAuthenticated
    ];
  
    if (isFileContent) {
      requestHandlers.push(express.raw({ type: contentType, limit: '4mb' }));
    }
  
    requestHandlers.push(validateRequestBody(queryArg, url));

    const baseUrl = url.split('?')[0];
    const methodLc = method.toLowerCase() as HttpMethodsLC;
  
    // Here we make use of the extra /api from the reverse proxy
    app[methodLc](`/api/${baseUrl}`, requestHandlers, async (req: Request, res: Response) => {
 
      const requestId = nid('v4') as string;
      const user = req.user as StrategyUser;
      const session = req.session as ApiSession;

      let response = {} as typeof resultType;
      let wasCached = false;
      const cacheKey = user.sub + req.url.substring(5) // remove leading /api/ to accomodate simpler cache invalidation;
 
      if ('get' === methodLc && 'skip' !== cache) {
        const value = await redisClient.get(cacheKey);
        if (value) {
          response = JSON.parse(value);
          res.header('X-Cache-Status', 'HIT');
          wasCached = true;
        }
      }
  
      if (!wasCached) {
        res.header('X-Cache-Status', 'MISS');
  
        try {
          const xfwd = (req.headers['x-forwarded-for'] as string).split('.');
          const sourceIp = xfwd.filter((a, i) => i !== xfwd.length - 1).join('.') + '.000';

          const requestProps = {
            db: dbClient,
            tx: {} as ITask<unknown>,
            redis: redisClient,
            keycloak: keycloakClient,
            logger: graylogClient,
            redisProxy,
            fetch,
            rateLimitResource,
            fs: { saveFile, putFile, getFile },
            ai: { useAi },
            event: {
              requestId,
              method,
              url,
              public: false,
              group: session.group || {},
              groups: session.groups,
              availableUserGroupRoles: session.availableUserGroupRoles || {},
              userSub: user.sub,
              sourceIp,
              pathParameters: req.params as Record<string, string>,
              queryParameters: req.query as Record<string, string>,
              body: req.body
            }
          };

          graylogClient.log(`Handling api ${kind}`, { ...requestProps.event, body: isFileContent ? 'File' : req.body });

          console.log('handling', kind, method, url, user.sub, requestId);
  
          const handler = siteApiHandlerRef[apiRefId as keyof typeof siteApiHandlerRef];

          if (EndpointType.MUTATION === kind) {
            response = await dbClient.tx(async tx => {
              requestProps.tx = tx
              return await handler(requestProps)
            });
          } else {
            response = await handler(requestProps);
          }
  
          /**
          * Cache settings:
          * 'skip' - Bypasses caching entirely
          * null - GET: Stores indefinitely; Non-GET: Deletes if exists
          * true/number - GET: Stores with 180s (or custom) expiry; Non-GET: Deletes if exists
          */
  
          if (response && 'boolean' !== typeof response && 'skip' !== cache) {
            if ('get' === methodLc) {
              if (null === cache) {
                await redisClient.set(cacheKey, JSON.stringify(response))
              } else {
                await redisClient.setex(cacheKey, cache as number || 180, JSON.stringify(response));
              }
            } else {
              if (null !== cache) {
                await redisClient.del(cacheKey);
              }
            }
          }
  
        } catch (error) {
          try {
            const { message, reason, requestId: _, ...actionProps } = error as Error & ApiErrorResponse;
    
            console.log('protected error', message || reason);
            graylogClient.log('error response', { requestId, message, reason });
    
            res.status(500).send({
              requestId,
              reason: reason || message,
              ...actionProps
            });
          } catch (error) {
            const { message, reason } = error as Error & ApiErrorResponse;
  
            res.status(500).send({
              requestId,
              reason: reason || message
            });
          }
          return;
        }
      }
  
      if (typeof response === 'object' && (response as BufferResponse).buffer instanceof ArrayBuffer) {
        const { name, buffer } = response as BufferResponse;
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(Buffer.from(buffer));
      } else if (!!response || 'object' === typeof response && Object.keys(response).length) {
        // Respond
        res.status(200).json(response);
      } else {
        res.status(500).send({ reason: 'Cannot process request', requestId })
      }
    });
  }

}
