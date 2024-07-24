import { FILTER_TYPE } from './iptv.type';

export type AppConfig = {
  iptvView: {
    filter: FILTER_TYPE;
    code?: string;
  };
  app?: {
    iptv?: {
      isOverrideApi?: boolean;
      apiUrl?: string;
      cacheDuration?: number;
    };
    network?: {
      isUseDOH?: boolean;
      dohResolverUrl?: string;
    };
  };
};