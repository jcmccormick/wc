import { useCallback } from 'react';
// import { HttpResponse } from '@aws-sdk/types';
import routeMatch, { RouteMatch } from 'route-match';

import { 
  ApiResponseBody, 
  CallApi, 
  IActionTypes, 
  IUtilActionTypes, 
  IFilesActionTypes,
  IScheduleActionTypes,
  IScheduleContextActionTypes,
  IServiceActionTypes,
  IServiceAddonActionTypes,
  IManageUsersActionTypes, 
  IManageGroupsActionTypes, 
  IManageRolesActionTypes, 
  IUserProfileActionTypes,
  ApiErrorResponse,
  ILoadedState
} from 'awayto';

import { useAct } from './useAct';

import keycloak from '../keycloak';

export function registerApi(api: IActionTypes): void {
  ApiActions = Object.assign(ApiActions, api);
}

let ApiActions = Object.assign(
  IFilesActionTypes,
  IScheduleActionTypes,
  IScheduleContextActionTypes,
  IServiceActionTypes,
  IServiceAddonActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes
) as Record<string, string>;

const { Route, RouteCollection, PathGenerator } = routeMatch as RouteMatch;

const paths = Object.keys(ApiActions).map(key => {
  return new Route(key, ApiActions[key])
});

const routeCollection = new RouteCollection(paths);
const generator = new PathGenerator(routeCollection);

const { START_LOADING, API_SUCCESS, STOP_LOADING, SET_SNACK } = IUtilActionTypes;

const callApi = async ({ path = '', method = 'GET', body }: CallApi): Promise<Response> => {

  type ApiResponse = Response & Partial<ApiResponseBody> & Response;
  
  const response = await fetch(`/api/${path}`, {
    method, body, headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${keycloak.token as string}`
    }
  } as RequestInit) as ApiResponse;

  console.log('This is whats resolved from fetch ', response, response.ok);

  if (response.ok) {
    try {
      return await response.json() as Response;
    } catch (error) {
      void keycloak.login();
    }
  }

  throw await response.json() as ApiErrorResponse;
};


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
 * If the endpoint takes path parameters, we can pass them in as options. Pass a boolean as the second argument to show or hide a loading screen.
 *
 * ```
 * api(GET_MANAGE_USERS_BY_ID, false, { id });
 * ```
 * 
 * @category Hooks
 */
export function useApi(): <T = unknown>(actionType: IActionTypes, load?: boolean, body?: T, meta?: unknown) => Promise<unknown> {
  const act = useAct();

  const func = useCallback(async <T = unknown>(actionType: IActionTypes, load?: boolean, body?: T, meta?: unknown) => {
    
    const methodAndPath = actionType.valueOf().split(/\/(.+)/);
    const method = methodAndPath[0];
    let path = methodAndPath[1];

    if (load) act(START_LOADING, { isLoading: true });
    
    if (['delete', 'get'].indexOf(method.toLowerCase()) > -1 && body && Object.keys(body).length) {
      // Get the key of the enum from ApiActions based on the path (actionType)
      const pathKey = Object.keys(ApiActions).filter((x) => ApiActions[x] == actionType)[0];
      path = generator.generate(pathKey, body as unknown as Record<string, string>).split(/\/(.+)/)[1];
      body = undefined;
    }

    try {
      const response = await callApi({
        path,
        method,
        body: !body ? undefined : 'string' == typeof body ? body : JSON.stringify(body)
      });

      const responseBody = ('string' === typeof response.body ? JSON.parse(response.body) : response) as T;
      act(actionType || API_SUCCESS, responseBody as ILoadedState, meta);
      return responseBody;
      
    } catch (error) {
      const { requestId, reason } = error as ApiErrorResponse;
      act(SET_SNACK, {
        snackRequestId: requestId,
        snackType: 'error',
        snackOn: 'Error: ' + (reason ? reason : 'Internal service error. You can report this if needed.')
      });
    } finally {
      if (load) act(STOP_LOADING, { isLoading: false });
    }

  }, [])

  return func;
}
