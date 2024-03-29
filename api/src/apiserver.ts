import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '../.env' })

import fs from 'fs';
import https from 'https';
import tls from 'tls';
import express, { Express } from 'express';

import Redis from 'ioredis';

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakAdminClient } from '@keycloak/keycloak-admin-client/lib/client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { BaseClient } from 'openid-client';
import pgPromise, { IDatabase } from 'pg-promise';
import { graylog } from 'graylog2';
import { PerformanceObserver } from 'perf_hooks';

import type { KcSiteOpts, RedisProxy, ClearLocalCache, RateLimitResource, Regroup } from 'awayto/core';

import { setupMiddleware } from './middlewares/setupMiddleware';
import { redisProxy, clearLocalCache, rateLimitResource } from './modules/redis';
import { initKeycloak, regroup } from './modules/keycloak';
import { initDb } from './modules/db';
import { initSocket } from './modules/sock';

import buildBaseRoutes from './routes/base';
import buildAuthRoutes from './routes/auth';
import buildSockRoutes from './routes/sock';
import buildKioskRoutes from './routes/kiosk';

import './modules/prompts';

const pgp = pgPromise();

const {
  KC_REALM,
  KC_HOST,
  KC_PORT,
  KC_API_CLIENT_ID,
  KC_API_CLIENT_SECRET,
  HOST_KEY_LOC,
  HOST_CERT_LOC,
  REDIS_PASS,
  REDIS_HOST,
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE,
  GRAYLOG_HOST,
  GRAYLOG_PORT
} = process.env as { [prop: string]: string };

const credentials: Credentials = {
  clientId: KC_API_CLIENT_ID,
  clientSecret: KC_API_CLIENT_SECRET,
  grantType: 'client_credentials'
}

export default class ApiServer {
  private static apiServer: ApiServer;
  private static expressApp: Express;
  private static dbClient: IDatabase<unknown>;
  private static redisClient: Redis;
  private static keycloakClient: KeycloakAdminClient & KcSiteOpts;
  private static graylogClient: graylog;

  constructor() { }

  public static init() {
    if (!ApiServer.apiServer) {
  
      const key = fs.readFileSync(HOST_KEY_LOC, 'utf-8');
      const cert = fs.readFileSync(HOST_CERT_LOC, 'utf-8');
  
      if (!key || !cert) throw 'Missing certs.';
  
      if (process.env.EXIT_FULLCHAIN_LOC && process.env.CA_CERT_LOC) {
        const exitFullchain = fs.readFileSync(process.env.EXIT_FULLCHAIN_LOC, 'utf-8');
        const caCert = fs.readFileSync(process.env.CA_CERT_LOC, 'utf-8');
        https.globalAgent.options.ca = [...tls.rootCertificates, exitFullchain, caCert];
      }

      ApiServer.apiServer = new ApiServer();
        
      ApiServer.expressApp = express();

      ApiServer.graylogClient = new graylog({
        servers: [{
          host: GRAYLOG_HOST,
          port: parseInt(GRAYLOG_PORT)
        }]
      });
  
      ApiServer.redisClient = new Redis({
        password: REDIS_PASS,
        host: REDIS_HOST
      });

      ApiServer.keycloakClient = new KcAdminClient({
        baseUrl: `https://${KC_HOST}:${KC_PORT}`,
        realmName: KC_REALM,
      }) as KeycloakAdminClient & KcSiteOpts & { apiClient: BaseClient; };

      ApiServer.keycloakClient.regroup = ApiServer.regroup;

      ApiServer.dbClient = pgp({
        host: PG_HOST,
        port: parseInt(PG_PORT),
        user: PG_USER,
        password: PG_PASSWORD,
        database: PG_DATABASE
      });

      ApiServer.keycloakClient.auth(credentials).then(async () => {
        console.log('keycloak connected');

        ApiServer.regroup().then(async () => {

          await initKeycloak(ApiServer.keycloakClient, ApiServer.redisClient);
          
          await initDb(ApiServer.dbClient, ApiServer.redisClient);

          await initSocket(ApiServer.dbClient);

          await setupMiddleware(ApiServer.redisClient, ApiServer.expressApp);

          buildBaseRoutes(ApiServer.expressApp, ApiServer.dbClient, ApiServer.redisClient, ApiServer.graylogClient, ApiServer.keycloakClient, ApiServer.redisProxy, ApiServer.rateLimitResource);
          buildAuthRoutes(ApiServer.expressApp, ApiServer.dbClient, ApiServer.redisClient, ApiServer.graylogClient, ApiServer.keycloakClient, ApiServer.redisProxy, ApiServer.rateLimitResource);
          buildSockRoutes(ApiServer.expressApp, ApiServer.dbClient, ApiServer.graylogClient);
          buildKioskRoutes(ApiServer.expressApp, ApiServer.dbClient, ApiServer.rateLimitResource);

          https.createServer({ key, cert }, ApiServer.expressApp).listen(9443);
          console.log('server listening on port 9443');
        });
  
        // Refresh api credentials/groups every 58 seconds
        setInterval(async () => {
          try {
            await ApiServer.keycloakClient.auth(credentials);
            ApiServer.regroup();
          } catch (error) {
            console.log('Could not auth with keycloak and regroup. Will try again in 1 minute.');
          }
        }, 58 * 1000); // 58 seconds

        const obs = new PerformanceObserver(items => {
          items.getEntries().forEach(measure => {
            const payload: Record<string, unknown> = { ...measure.toJSON() };
            const [measureType, ...data] = measure.name.split(' ');
            
            if ('regroup' === measureType) {
              payload.groupCount = data[0];
              payload.roleCount = data[1];
            }
        
            ['Start', 'End'].forEach(markType => performance.clearMarks(`${measureType}${markType}`));
        
            ApiServer.getLogger().log('performance', { body: payload });
          });
        });
        
        obs.observe({ entryTypes: ['measure'] });

      });
    }
  }

  public static getApiServer() {
    return ApiServer.apiServer;
  }

  public static getRedisClient() {
    return ApiServer.redisClient;
  }

  public static getKeycloakClient() {
    return ApiServer.keycloakClient;
  }

  public static getLogger() {
    return ApiServer.graylogClient;
  }

  public static clearLocalCache(...args: Parameters<ClearLocalCache>) {
    return clearLocalCache(...args);
  }

  public static redisProxy(...args: Parameters<RedisProxy>) {
    return redisProxy(ApiServer.redisClient)(...args);
  }

  public static rateLimitResource(...args: Parameters<RateLimitResource>) {
    return rateLimitResource(ApiServer.redisClient)(...args);
  }

  public static regroup(...args: Parameters<Regroup>) {
    return regroup(ApiServer.keycloakClient, ApiServer.redisClient, ApiServer.redisProxy, ApiServer.clearLocalCache)(...args);
  }
}

ApiServer.init();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
