import { Reducer } from 'redux';
import {
  IServiceAddonState,
  IServiceAddonActions,
  IServiceAddonActionTypes,
  IServiceAddon,
} from 'awayto';

const initialServiceAddonState = {
  serviceAddons: new Map()
} as IServiceAddonState;

const serviceAddonsReducer: Reducer<IServiceAddonState, IServiceAddonActions> = (state = initialServiceAddonState, action) => {
  switch (action.type) {
    case IServiceAddonActionTypes.DISABLE_SERVICE_ADDON:
    case IServiceAddonActionTypes.DELETE_SERVICE_ADDON:
      action.payload.forEach(serviceAddon => {
        state.serviceAddons.delete(serviceAddon.id);
      });
      return state;
    case IServiceAddonActionTypes.PUT_SERVICE_ADDON:
    case IServiceAddonActionTypes.POST_SERVICE_ADDON:
    case IServiceAddonActionTypes.GET_SERVICE_ADDON_BY_ID:
    case IServiceAddonActionTypes.GET_SERVICE_ADDONS:
      state.serviceAddons = new Map([ ...state.serviceAddons ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IServiceAddon][] ));
      return state;
    default:
      return state;
  }
};

export default serviceAddonsReducer;

export const persist = true;