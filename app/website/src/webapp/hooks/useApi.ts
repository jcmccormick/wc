import { useCallback } from 'react';
// import { HttpResponse } from '@aws-sdk/types';
import routeMatch, { RouteMatch } from 'route-match';

import {
  IActionTypes,
  IUtilActionTypes,
  IFileActionTypes,
  IScheduleActionTypes,
  IServiceActionTypes,
  IQuoteActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes,
  IGroupActionTypes,
  IGroupServiceActionTypes,
  IGroupServiceAddonActionTypes,
  IGroupScheduleActionTypes,
  IGroupUserScheduleActionTypes,
  IGroupFormActionTypes,
  IRoleActionTypes,
  IUserActionTypes,
  ApiErrorResponse,
  IServiceAddonActionTypes,
  IAssistActionTypes,
  StatePayloadValues,
  IFormActionTypes
} from 'awayto';

import { useAct } from './useAct';

import keycloak from '../keycloak';

export function registerApi(api: IActionTypes): void {
  ApiActions = Object.assign(ApiActions, api);
}

let ApiActions = Object.assign(
  IFileActionTypes,
  IScheduleActionTypes,
  IServiceActionTypes,
  IServiceAddonActionTypes,
  IQuoteActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes,
  IGroupActionTypes,
  IGroupServiceActionTypes,
  IGroupServiceAddonActionTypes,
  IGroupScheduleActionTypes,
  IGroupUserScheduleActionTypes,
  IGroupFormActionTypes,
  IRoleActionTypes,
  IUserActionTypes,
  IAssistActionTypes,
  IFormActionTypes
) as Record<string, string>;

const { Route, RouteCollection, PathGenerator } = routeMatch as RouteMatch;

const paths = Object.keys(ApiActions).map(key => {
  return new Route(key, ApiActions[key])
});

const routeCollection = new RouteCollection(paths);
const generator = new PathGenerator(routeCollection);

const { SET_LOADING, API_SUCCESS, SET_SNACK } = IUtilActionTypes;


type ApiMeta = {
  load: boolean;
  useParams: boolean;
  noRedux: boolean;
  noRedis: boolean;
  debounce: {
    time: number;
  };
  api: {
    method: string;
    path: string;
    body?: Partial<StatePayloadValues>;
  };
}

/**
 * The `useApi` hook provides type-bound api functionality. By passing in a {@link IActionTypes} we can control the structure of the api request, and more easily handle it on the backend.
 * 
 * ```
 * import { useApi, IManageUsersActions } from 'awayto';
 * 
 * const { GET_MANAGE_USERS, GET_MANAGE_USERS_BY_ID } = IManageUsersActions;
 * 
 * const api = useApi();
 * 
 * api(GET_MANAGE_USERS);
 * ```
 * 
 * As long as we have setup our model, `GET_MANAGE_USERS` will inform the system of the API endpoint and shape of the request/response.
 * 
 * If the endpoint takes path parameters, we can pass them in as options. Pass an options object as the third argument to pass options like show a loading screen or skip redis/redux.
 *
 * ```
 * api(GET_MANAGE_USERS_BY_ID, { id }, { noRedis: true });
 * ```
 * 
 * @category Hooks
 */

export function useApi(): <T extends { [prop: string]: unknown}, R = IMergedState>(actionType: IActionTypes, body?: Partial<T | StatePayloadValues>, meta?: Partial<ApiMeta>) => [(reason?: string)=> void, Promise<R> | undefined] {
  const act = useAct();

  const api = useCallback(<T extends { [prop: string]: unknown}, R = IMergedState>(actionType: IActionTypes, body?: Partial<T | StatePayloadValues>, meta = {} as Partial<ApiMeta>): [(reason?: string)=> void, Promise<R> | undefined] => {

    const abortController: AbortController = new AbortController();
    function abort(reason?: string) {
      abortController.abort(reason);
    }
    
    const { load } = meta;

    try {

      if (load) act(SET_LOADING, { isLoading: true });

      const methodAndPath = actionType.valueOf().split(/\/(.+)/);
      const method = methodAndPath[0];
      let path = methodAndPath[1];

      let jsonBody: string | undefined = JSON.stringify(body);

      if (path.includes('/:') && body) {
        // Get the key of the enum from ApiActions based on the path (actionType)
        const pathKey = Object.keys(ApiActions).filter((x) => ApiActions[x] == actionType)[0];

        // Only access body keys that are part of the action param string (GET/path/:id/subpath/:subId will expect id and subId in the body and only try to get them)
        const keys = [...actionType.matchAll(/(?<=\/:)(\w*)/g)];
        const keyBody = {} as Record<string, string>;
        for (const k of keys) {
          keyBody[k[0]] = body[k[0]] as string;
        }

        // When "generator.generate" takes more keys than it requires for the base path, it turns those extras into query parameters, so we either do want that or don't and it needs to be set with { useParams: true } as a meta option, allowing for GET/path?some=param&array=values
        // This will automatically be handled in the express controller and the query params available in props.event.queryParameters
        path = generator.generate(pathKey, meta.useParams ? body as Record<string, string> : keyBody).slice(method.length + 1);
      }

      if (['delete', 'get'].indexOf(method.toLowerCase()) > -1 && body) {
        jsonBody = undefined;
      }

      const response = fetch(`/api/${path}`, {
        signal: abortController.signal,
        method,
        body: jsonBody,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token as string}`
        }
      })
      .then(async res => {
        if (!res.ok) throw await res.json();
        return res.json()
      })
      .then((data: R) => {
        act(actionType || API_SUCCESS, data as IMergedState, { ...meta, method, path, body: body && body as Partial<StatePayloadValues> });
        if (load) act(SET_LOADING, { isLoading: false });
        return data;
      })
      .catch(err => {
        const { name, requestId, reason } = err as ApiErrorResponse;

        if (['AbortError'].includes(name as string)) throw 'Request aborted.';

        act(SET_SNACK, {
          snackRequestId: requestId,
          snackType: 'error',
          snackOn: 'Error: ' + (reason ? reason : 'Internal service error. You can report this if needed.')
        });
        
        if (load) act(SET_LOADING, { isLoading: false });
        
        throw err;
      });

      return [abort, response];
    } catch (error) {
      console.error('Failed to parse preflight', error);
      if (load) act(SET_LOADING, { isLoading: false });
      return [abort, undefined];
    }
  }, []);

  return api;
}
