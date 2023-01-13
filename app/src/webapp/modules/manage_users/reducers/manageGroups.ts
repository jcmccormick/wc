import { Reducer } from 'redux';
import {
  IGroup,
  IGetManageGroupsAction,
  IManageGroupsActionTypes,
  IManageGroupsState,
  IPostManageGroupsAction,
  IPutManageGroupsAction,
  IDeleteManageGroupsAction,
  IManageGroupsActions,
  ILogoutActionTypes,
  IDisableManageGroupsAction
} from 'awayto';

const initialManageGroupsState: IManageGroupsState = {
  isValid: true
};

function reduceGetManageGroups(state: IManageGroupsState, action: IGetManageGroupsAction): IManageGroupsState {
  return { ...state, groups: [...action.payload as IGroup[]] };
}

function reducePostManageGroups(state: IManageGroupsState, action: IPostManageGroupsAction): IManageGroupsState {
  state.groups = Array.prototype.concat(state.groups, action.payload);
  return { ...state };
}

function reducePutManageGroups(state: IManageGroupsState, action: IPutManageGroupsAction): IManageGroupsState {
  const payload = action.payload as IGroup;
  state.groups = state.groups?.map((user: IGroup) => {
    if (user.id === payload.id) {
      return { ...user, ...payload }
    }
    return user;
  });
  return { ...state };
}

function reduceDeleteState(state: IManageGroupsState, action: IDeleteManageGroupsAction): IManageGroupsState {
  const { groups } = state;
  if (groups) {
    state.groups = groups.filter(group => group.id !== action.payload.id);
  }
  return state;
}

function reduceDisableState(state: IManageGroupsState, action: IDisableManageGroupsAction): IManageGroupsState {
  const { groups } = state;
  if (groups) {
    state.groups = groups.filter(g => !action.payload.some(gr => gr.id == g.id))
  }
  return state;
}

const manageGroupsReducer: Reducer<IManageGroupsState, IManageGroupsActions> = (state = initialManageGroupsState, action) => {
  switch (action.type) {
    case ILogoutActionTypes.LOGOUT:
      return initialManageGroupsState;
    case IManageGroupsActionTypes.GET_MANAGE_GROUPS:
      return reduceGetManageGroups(state, action);
    case IManageGroupsActionTypes.POST_MANAGE_GROUPS:
      return reducePostManageGroups(state, action);
    case IManageGroupsActionTypes.PUT_MANAGE_GROUPS:
      return reducePutManageGroups(state, action);
    case IManageGroupsActionTypes.DELETE_MANAGE_GROUPS:
      return reduceDeleteState(state, action);
    case IManageGroupsActionTypes.DISABLE_MANAGE_GROUPS:
      return reduceDisableState(state, action);
    case IManageGroupsActionTypes.CHECK_GROUP_NAME:
      return { ...state, ...action.payload }
    default:
      return state;
  }
};

export default manageGroupsReducer;