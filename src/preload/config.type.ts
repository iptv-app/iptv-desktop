import { FILTER_TYPE } from './iptv.type';

export type AppConfig = {
  iptvView: {
    filter: FILTER_TYPE;
    code?: string;
  };
  favorites?: string[];
  app?: {
    iptv?: {
      isOverrideApi?: boolean;
      apiUrl?: string;
      cacheDuration?: number;
      isUseAltChannelName?: boolean;
    };
    network?: {
      isUseDOH?: boolean;
      dohResolverUrl?: string;
    };
    caption?: {
      isAutoShow?: boolean;
      isEnableCEA708?: boolean;
    };
    userInterface?: {
      isUseSystemTitlebar?: boolean;
    };
    timeshift?: {
      isEnabled?: boolean;
      bufferMinutes?: number;
    };
  };
};
