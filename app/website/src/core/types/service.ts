import { LogoutAction } from 'awayto';
import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    services: IServiceState;
    serviceAddons: IServiceAddonState;
    serviceTiers: IServiceTierState;
  }

  /**
   * @category Awayto Redux
   */
  type IServiceModuleActions = IServiceActions | IServiceAddonActions | IServiceTierActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    services: IServiceActionTypes;
    serviceAddons: IServiceAddonActionTypes;
    serviceTiers: IServiceTierActionTypes;
  }
}


/**
 * @category Awayto
 */
export type IService = {
  id?: string;
  name: string;
  cost: number;
  tiers: IServiceTier[];
};


/**
 * @category Service
 */
export type IServiceState = {
  services: Record<string, IService>;
};

/**
 * @category Action Types
 */
export enum IServiceActionTypes {
  POST_SERVICE = "POST/services",
  PUT_SERVICE = "PUT/services",
  GET_SERVICES = "GET/services",
  GET_SERVICE_BY_ID = "GET/services/:id",
  DELETE_SERVICE = "DELETE/services/:id",
  DISABLE_SERVICE = "PUT/services/:id/disable"
}

/**
 * @category Service
 */
export type IPostServiceAction = PayloadAction<IServiceActionTypes.POST_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IPutServiceAction = PayloadAction<IServiceActionTypes.PUT_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IGetServicesAction = PayloadAction<IServiceActionTypes.GET_SERVICES, IService[]>;

/**
 * @category Service
 */
export type IGetServiceByIdAction = PayloadAction<IServiceActionTypes.GET_SERVICE_BY_ID, IService[]>;

/**
 * @category Service
 */
export type IDeleteServiceAction = PayloadAction<IServiceActionTypes.DELETE_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IDisableServiceAction = PayloadAction<IServiceActionTypes.DISABLE_SERVICE, IService[]>;

/**
 * @category Service
 */
export type IServiceActions = LogoutAction
  | IPostServiceAction 
  | IPutServiceAction 
  | IGetServicesAction 
  | IGetServiceByIdAction
  | IDeleteServiceAction
  | IDisableServiceAction;



/**
 * @category Service
 */
 export type IServiceAddon = {
  id?: string;
  name: string;
};

/**
 * @category Service
 */
 export type IServiceAddonState = {
   serviceAddons: Record<string, IServiceAddon>;
 };

 /**
  * @category Action Types
  */
 export enum IServiceAddonActionTypes {
   POST_SERVICE_ADDON = "POST/service_addons",
   PUT_SERVICE_ADDON = "PUT/service_addons",
   GET_SERVICE_ADDONS = "GET/service_addons",
   GET_SERVICE_ADDON_BY_ID = "GET/service_addons/:id",
   DELETE_SERVICE_ADDON = "DELETE/service_addons/:id",
   DISABLE_SERVICE_ADDON = "PUT/service_addons/:id/disable"
 }
 
 /**
  * @category Service
  */
 export type IPostServiceAddonAction = PayloadAction<IServiceAddonActionTypes.POST_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IPutServiceAddonAction = PayloadAction<IServiceAddonActionTypes.PUT_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IGetServiceAddonsAction = PayloadAction<IServiceAddonActionTypes.GET_SERVICE_ADDONS, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IGetServiceAddonByIdAction = PayloadAction<IServiceAddonActionTypes.GET_SERVICE_ADDON_BY_ID, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IDeleteServiceAddonAction = PayloadAction<IServiceAddonActionTypes.DELETE_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IDisableServiceAddonAction = PayloadAction<IServiceAddonActionTypes.DISABLE_SERVICE_ADDON, IServiceAddon[]>;
 
 /**
  * @category Service
  */
 export type IServiceAddonActions = LogoutAction
   | IPostServiceAddonAction 
   | IPutServiceAddonAction 
   | IGetServiceAddonsAction 
   | IGetServiceAddonByIdAction
   | IDeleteServiceAddonAction
   | IDisableServiceAddonAction;
 


/**
 * @category Service
 */
 export type IServiceTier = {
  id?: string;
  serviceId?: string;
  name: string;
  multiplier: string;
  addons: IServiceAddon[];
};


/**
 * @category Service
 */
 export type IServiceTierState = Partial<IServiceTier>;

 /**
  * @category Action Types
  */
 export enum IServiceTierActionTypes {
   POST_SERVICE_TIER = "POST/service_tiers",
   PUT_SERVICE_TIER = "PUT/service_tiers",
   GET_SERVICE_TIERS = "GET/service_tiers",
   GET_SERVICE_TIER_BY_ID = "GET/service_tiers/:id",
   DELETE_SERVICE_TIER = "DELETE/service_tiers/:id",
   DISABLE_SERVICE_TIER = "PUT/service_tiers/:id/disable"
 }
 
 /**
  * @category Service
  */
 export type IPostServiceTierAction = PayloadAction<IServiceTierActionTypes.POST_SERVICE_TIER, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IPutServiceTierAction = PayloadAction<IServiceTierActionTypes.PUT_SERVICE_TIER, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IGetServiceTiersAction = PayloadAction<IServiceTierActionTypes.GET_SERVICE_TIERS, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IGetServiceTierByIdAction = PayloadAction<IServiceTierActionTypes.GET_SERVICE_TIER_BY_ID, IServiceTier>;
 
 /**
  * @category Service
  */
 export type IDeleteServiceTierAction = PayloadAction<IServiceTierActionTypes.DELETE_SERVICE_TIER, IServiceTierState>;
 
 /**
  * @category Service
  */
 export type IDisableServiceTierAction = PayloadAction<IServiceTierActionTypes.DISABLE_SERVICE_TIER, IServiceTierState>;
 
 /**
  * @category Service
  */
 export type IServiceTierActions = LogoutAction
   | IPostServiceTierAction 
   | IPutServiceTierAction 
   | IGetServiceTiersAction 
   | IGetServiceTierByIdAction
   | IDeleteServiceTierAction
   | IDisableServiceTierAction;