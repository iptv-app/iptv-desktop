import { net } from 'electron';
import { getOrSetJSONCache } from './cache';
import {
  FILTER_TYPE,
  IPTVCategory,
  IPTVChannel,
  IPTVCountry,
  IPTVLanguage,
  IPTVStream
} from '../preload/iptv.type';

const BASE_URL = 'https://iptv-org.github.io/api';

export const getAllCountry = async () => {
  const content = await getOrSetJSONCache('countries', async () => {
    const res = await net.fetch(BASE_URL + '/countries.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVCountry[];
};
export const getAllCategory = async () => {
  const content = await getOrSetJSONCache('categories', async () => {
    const res = await net.fetch(BASE_URL + '/categories.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVCategory[];
};
export const getAllLanguage = async () => {
  const content = await getOrSetJSONCache('languages', async () => {
    const res = await net.fetch(BASE_URL + '/languages.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVLanguage[];
};
const getAllChannel = async () => {
  const content = await getOrSetJSONCache('channels', async () => {
    const res = await net.fetch(BASE_URL + '/channels.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVChannel[];
};
const getAllStreams = async () => {
  const content = await getOrSetJSONCache('streams', async () => {
    const res = await net.fetch(BASE_URL + '/streams.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVStream[];
};
const getChannelWithStream = async () => {
  const [channels, streams] = await Promise.all([getAllChannel(), getAllStreams()]);

  return channels.filter((item) => streams.find((it) => it.channel === item.id));
};
export const getFilteredActiveChannel = async (type: FILTER_TYPE, code: string) => {
  switch (type) {
    case 'country':
      var filterFn = (item: IPTVChannel) => item.country === code;
      break;

    case 'category':
      filterFn = (item: IPTVChannel) => item.categories.includes(code);
      break;

    case 'language':
      filterFn = (item: IPTVChannel) => item.languages.includes(code);
      break;

    default:
      return [];
  }

  const channels = await getChannelWithStream();

  return channels.filter(filterFn);
};
