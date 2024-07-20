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
export type IPTVChannelWithStream = IPTVChannel & {
  streams: IPTVStream[];
};
export type FILTER_TYPE = 'country' | 'category' | 'language';
