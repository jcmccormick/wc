import logger from 'redux-logger';
import thunk from 'redux-thunk';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { fetchBaseQuery, SkipToken } from '@reduxjs/toolkit/dist/query';
import { configureStore, AnyAction, createSlice, Middleware, Reducer, Store, ThunkDispatch } from '@reduxjs/toolkit';
import { createApi, setupListeners } from '@reduxjs/toolkit/query/react';

import { QueryDefinition, MutationDefinition } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { MutationTrigger, LazyQueryTrigger, UseLazyQueryLastPromiseInfo, UseQuery, UseLazyQuery, UseMutation } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import { EndpointType, RemoveNever, ReplaceVoid, siteApiRef, SiteApiRef, utilConfig } from 'awayto/core';

import { QueryArgFrom, ResultTypeFrom } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

export const getQueryAuth = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: headers => {
    const token = localStorage.getItem('kc_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

export type SiteBaseEndpoint = typeof getQueryAuth;
export type SiteQuery<TQueryArg, TResultType> = QueryDefinition<TQueryArg, SiteBaseEndpoint, 'Root', TResultType, 'api'>;
export type SiteMutation<TQueryArg, TResultType> = MutationDefinition<TQueryArg, SiteBaseEndpoint, 'Root', TResultType, 'api'>;

export type { MutationTrigger };
/**
 * The following collection of types tracks a custom set of react hooks which are adapted from the hooks autogenerated by RTK-Query.
 * Some of the base types are directly adapted from, i.e. https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#usequery which should be used as a reference.
 */

type UseQueryOptions<R> = {
  pollingInterval?: number
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
  skip?: boolean
  refetchOnMountOrArgChange?: boolean | number
  selectFromResult?: (result: R) => R
};

type UseLazyQueryOptions<R> = {
  pollingInterval?: number
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
  selectFromResult?: (result: R) => R
}

type UseMutationStateOptions<R> = {
  selectFromResult?: (result: R) => R
  fixedCacheKey?: string
}

type CommonHookResult<T> = {
  // Base query state
  originalArgs?: unknown // Arguments passed to the query

  error?: unknown // Error result if present
  requestId?: string // A string generated by RTK Query
  endpointName?: string // The name of the given endpoint for the query

  startedTimeStamp?: number // Timestamp for when the query was initiated
  fulfilledTimeStamp?: number // Timestamp for when the query was completed

  // Derived request status booleans
  isUninitialized: boolean // Query has not started yet.
  isLoading: boolean // Query is currently loading for the first time. No data yet.
  isFetching: boolean // Query is currently fetching, but might have data from an earlier request.
  isSuccess: boolean // Query has data from a successful load.
  isError: boolean // Query is currently in an "error" state.
} & T extends unknown[] ? { data: T } : { data: Partial<T> };


type UseQueryResult<T> = CommonHookResult<T> & {
  currentData: T
  refetch: () => void
};

type UseLazyQueryResult<T> = CommonHookResult<T> & {
  currentData: T;
};

type UseMutationResult<T> = CommonHookResult<T> & {
  reset: () => void
};

type CustomUseQuery<D extends QueryDefinition<QueryArgFrom<D>, SiteBaseEndpoint, 'Root', ResultTypeFrom<D>, 'api'>> = (
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQueryOptions<ResultTypeFrom<D>>
) => UseQueryResult<ResultTypeFrom<D>>;

type CustomUseLazyQuery<D extends QueryDefinition<QueryArgFrom<D>, SiteBaseEndpoint, 'Root', ResultTypeFrom<D>, 'api'>> = (
  options?: UseLazyQueryOptions<ResultTypeFrom<D>>
) => [
  LazyQueryTrigger<D>, 
  UseLazyQueryResult<ResultTypeFrom<D>>, 
  UseLazyQueryLastPromiseInfo<D>
];

type CustomUseMutation<D extends MutationDefinition<QueryArgFrom<D>, SiteBaseEndpoint, 'Root', ResultTypeFrom<D>, 'api'>> = (
  options?: UseMutationStateOptions<ResultTypeFrom<D>>
) => [
  MutationTrigger<D>, 
  UseMutationResult<ResultTypeFrom<D>>
];

type QueryKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.QUERY }
  ? `use${Capitalize<string & K>}Query`
  : never;
}[keyof T];

type LazyQueryKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.QUERY }
  ? `useLazy${Capitalize<string & K>}Query`
  : never;
}[keyof T];

type MutationKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.MUTATION }
  ? `use${Capitalize<string & K>}Mutation`
  : never;
}[keyof T];

type EndpointInfo<T> = {
  [K in QueryKeys<T>]: K extends `use${infer U}Query`
  ? Uncapitalize<U> extends keyof T ? UseQuery<
    SiteQuery<
      ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
      ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
    >
  > : never
  : never;
} & {
    [K in LazyQueryKeys<T>]: K extends `useLazy${infer U}Query`
    ? Uncapitalize<U> extends keyof T ? UseLazyQuery<
      SiteQuery<
        ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
        ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
      >
    > : never
    : never;
  } & {
    [K in MutationKeys<T>]: K extends `use${infer U}Mutation`
    ? Uncapitalize<U> extends keyof T ? UseMutation<
      SiteMutation<
        ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
        ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
      >
    > : never
    : never;
  };

type EndpointQuery<T> = (args: T) => string | { url: string; method: string; body: T };

// Store Hooks
export const sh = createApi({
  baseQuery: getQueryAuth,
  endpoints: builder => Object.keys(siteApiRef).reduce((m, endpointName) => {
    const endpointKey = endpointName as keyof SiteApiRef;
    type BuiltEndpoint = typeof siteApiRef[typeof endpointKey];

    const ep = siteApiRef[endpointName as keyof SiteApiRef] as BuiltEndpoint;
    const { method, queryArg, resultType, url } = ep;

    const kind = ep.kind as EndpointType;

    type EPQueryArg = typeof queryArg;
    type EPResultType = typeof resultType;

    const builderPayload: {
      query: EndpointQuery<EPQueryArg>;
    } = {
      query: ((args: EPQueryArg) => {
        const processedUrl = url.replace(/:(\w+)/g, (_, key) => args[key as keyof EPQueryArg]);
        if (kind === EndpointType.QUERY) {
          return processedUrl;
        }
        return { url: processedUrl, method, body: args };
      })
    };

    return {
      ...m,
      [endpointName]: kind === EndpointType.QUERY ?
        builder.query<EPResultType, EPQueryArg>(builderPayload) :
        builder.mutation<EPResultType, EPQueryArg>(builderPayload),
    };
  }, {})
}) as RemoveNever<EndpointInfo<SiteApiRef>> & ReturnType<typeof createApi>;

console.log({ loadedup: Object.keys(sh) })

export const utilSlice = createSlice(utilConfig);

export const store = configureStore({
  reducer: {
    [sh.reducerPath]: sh.reducer as Reducer,
    util: utilSlice.reducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(
    sh.middleware as Middleware,
    thunk,
    logger
  )
});

setupListeners(store.dispatch);

/**
* @category Awayto Redux
*/
export type AppDispatch = typeof store.dispatch;

/**
* @category Awayto Redux
*/
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
* @category Awayto Redux
*/
export interface RootState extends ReturnType<typeof store.getState> { }

/**
* @category Awayto Redux
*/
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
* @category Awayto Redux
*/
export type ThunkStore = Store<RootState, AnyAction> & {
  dispatch: ThunkDispatch<RootState, undefined, AnyAction>;
}

declare global {
  interface IProps {
    store?: ThunkStore;
  }
}