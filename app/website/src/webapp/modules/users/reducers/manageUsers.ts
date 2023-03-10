import { Reducer } from 'redux';
import {
  IManageUsersState,
  IManageUsersActionTypes,
  IManageUsersActions,
  IUserProfile
} from 'awayto';

const initialManageUsersState = {
  users: new Map()
} as IManageUsersState;

const manageUsersReducer: Reducer<IManageUsersState, IManageUsersActions> = (state = initialManageUsersState, action) => {
  switch (action.type) {
    case IManageUsersActionTypes.GET_MANAGE_USERS:
    case IManageUsersActionTypes.POST_MANAGE_USERS:
    case IManageUsersActionTypes.GET_MANAGE_USERS_BY_ID:
    case IManageUsersActionTypes.GET_MANAGE_USERS_BY_SUB:
    case IManageUsersActionTypes.POST_MANAGE_USERS_APP_ACCT:
    case IManageUsersActionTypes.POST_MANAGE_USERS_SUB:
    case IManageUsersActionTypes.PUT_MANAGE_USERS:
    case IManageUsersActionTypes.LOCK_MANAGE_USERS:
    case IManageUsersActionTypes.UNLOCK_MANAGE_USERS:
    case IManageUsersActionTypes.GET_MANAGE_USERS_INFO:
      state.users = new Map([ ...state.users ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IUserProfile][] ));
      return state;
    default:
      return state;
  }
};

export default manageUsersReducer;