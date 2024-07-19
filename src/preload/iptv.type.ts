export type IPTVCountry = {
  name: string;
  code: string;
  languages: string[];
  flag: string;
};
export type IPTVCategory = {
  id: string;
  name: string;
};
export type IPTVLanguage = {
  code: string;
  name: string;
};
export type IPTVChannel = {
  id: string;
  name: string;
  alt_names: string[];
  network?: string;
  owners: string[];
  country: string;
  subdivision?: string;
  city?: string;
  broadcast_area: string[];
  languages: string[];
  categories: string[];
  is_nsfw: boolean;
  launched?: string;
  closed?: string;
  replaced_by?: string;
  website?: string;
  logo: string;
};
export type IPTVStream = {
  channel: string;
  url: string;
  timeshift?: string;
  http_referrer?: string;
  user_agent?: string;
};
export type FILTER_TYPE = 'country' | 'category' | 'language';

export type API = {
  getAllCountry: () => Promise<IPTVCountry[]>;
  getAllCategory: () => Promise<IPTVCategory[]>;
  getAllLanguage: () => Promise<IPTVLanguage[]>;
  getFilteredActiveChannel: (type: FILTER_TYPE, code: string) => Promise<IPTVChannel[]>;
};
