import {
  FILTER_TYPE,
  IPTVCategory,
  IPTVChannel,
  IPTVChannelWithStream,
  IPTVCountry,
  IPTVLanguage
} from './iptv.type';

export type API = {
  getAllCountry: () => Promise<IPTVCountry[]>;
  getAllCategory: () => Promise<IPTVCategory[]>;
  getAllLanguage: () => Promise<IPTVLanguage[]>;
  getFilteredActiveChannel: (type: FILTER_TYPE, code: string) => Promise<IPTVChannel[]>;
  getSingleChannelWithStream: (channelId: string) => Promise<IPTVChannelWithStream>;
  setIptvView: (filter: FILTER_TYPE, code?: string) => void;
};
