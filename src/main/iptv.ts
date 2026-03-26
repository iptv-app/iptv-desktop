import { net } from 'electron';
import { ECache, getJSONCache, getOrSetJSONCache, saveJSONCache } from './cache';
import {
  FILTER_TYPE,
  IPTVCategory,
  IPTVChannel,
  IPTVChannelWithStream,
  IPTVCountry,
  IPTVLanguage,
  IPTVStream
} from '../preload/iptv.type';
import config, { defaultAppConifg } from './config';

const baseUrl = () => {
  const url = config.chain.get('app.iptv.apiUrl', defaultAppConifg?.iptv?.apiUrl);
  return url.value();
};

const normalizeLogo = (logo?: string) => {
  if (!logo) return undefined;
  const trimmed = logo.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
};

type IPTVLogo = {
  channel: string;
  feed?: string | null;
  tags?: string[];
  width?: number;
  height?: number;
  format?: string | null;
  url: string;
};

export const getAllCountry = async () => {
  const content = await getOrSetJSONCache(ECache.COUNTRIES, async () => {
    const res = await net.fetch(baseUrl() + '/countries.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVCountry[];
};
export const getAllCategory = async () => {
  const content = await getOrSetJSONCache(ECache.CATEGORIES, async () => {
    const res = await net.fetch(baseUrl() + '/categories.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVCategory[];
};
export const getAllLanguage = async () => {
  const content = await getOrSetJSONCache(ECache.LANGUAGES, async () => {
    const res = await net.fetch(baseUrl() + '/languages.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVLanguage[];
};
const getAllChannel = async () => {
  const content = await getOrSetJSONCache(ECache.CHANNELS, async () => {
    const res = await net.fetch(baseUrl() + '/channels.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVChannel[];
};
const getAllStreams = async () => {
  const content = await getOrSetJSONCache(ECache.STREAMS, async () => {
    const res = await net.fetch(baseUrl() + '/streams.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVStream[];
};
const getAllLogos = async () => {
  const content = await getOrSetJSONCache(ECache.LOGOS, async () => {
    const res = await net.fetch(baseUrl() + '/logos.json');
    const json = await res.json();
    return json;
  });

  return content as IPTVLogo[];
};
const getChannelWithStream = async () => {
  const [channels, streams] = await Promise.all([getAllChannel(), getAllStreams()]);

  const streamChannelIds = new Set();
  streams.forEach((stream) => {
    streamChannelIds.add(stream.channel);
  });

  return channels.filter((item) => streamChannelIds.has(item.id));
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

    case 'favorites':
      const favorites = config.data.favorites || [];
      filterFn = (item: IPTVChannel) => favorites.includes(item.id);
      break;

    default:
      return [];
  }

  const channels = await getChannelWithStream();

  return channels.filter(filterFn);
};

export const getSingleChannelWithStream = async (
  channelId: string
): Promise<IPTVChannelWithStream> => {
  const channels = await getAllChannel();
  const channel = channels.find((item) => item.id === channelId);
  if (!channel) throw new Error("Can't find channel!");

  const streams = await getAllStreams();

  return {
    ...channel,
    streams: streams.filter((it) => it.channel === channelId)
  };
};

export const resolveChannelLogo = async (channelId: string, failedLogo?: string) => {
  const failedLogoNormalized = normalizeLogo(failedLogo);
  const logoCache = (getJSONCache(ECache.CHANNEL_LOGOS) || {}) as Record<string, string>;
  const cachedLogo = normalizeLogo(logoCache[channelId]);
  if (cachedLogo && cachedLogo !== failedLogoNormalized) {
    return cachedLogo;
  }

  const channels = await getAllChannel();
  const channel = channels.find((item) => item.id === channelId);
  const databaseLogo = normalizeLogo(channel?.logo);
  if (databaseLogo && databaseLogo !== failedLogoNormalized) {
    logoCache[channelId] = databaseLogo;
    saveJSONCache(ECache.CHANNEL_LOGOS, logoCache);
    return databaseLogo;
  }

  const logos = await getAllLogos();
  const bestMatch = logos
    .filter((item) => item.channel === channelId)
    .map((item) => ({
      ...item,
      url: normalizeLogo(item.url),
      area: (item.width || 0) * (item.height || 0)
    }))
    .filter((item) => item.url && item.url !== failedLogoNormalized)
    .sort((a, b) => {
      const feedScoreA = a.feed ? 0 : 1;
      const feedScoreB = b.feed ? 0 : 1;
      if (feedScoreA !== feedScoreB) return feedScoreB - feedScoreA;
      return b.area - a.area;
    })[0];

  if (bestMatch?.url) {
    logoCache[channelId] = bestMatch.url;
    saveJSONCache(ECache.CHANNEL_LOGOS, logoCache);
    return bestMatch.url;
  }

  return undefined;
};
