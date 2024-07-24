import { app } from 'electron';
import { readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import config, { defaultAppConifg } from './config';

export enum ECache {
  COUNTRIES = 'APPCACHE_countries',
  CATEGORIES = 'APPCACHE_categories',
  LANGUAGES = 'APPCACHE_languages',
  CHANNELS = 'APPCACHE_channels',
  STREAMS = 'APPCACHE_streams'
}

const getPath = (type: ECache) => join(app.getPath('userData'), type + '.json');
export const getJSONCache = (type: ECache) => {
  const path = getPath(type);
  const duration = config.chain
    .get('app.iptv.cacheDuration', defaultAppConifg?.iptv?.cacheDuration)
    .value();

  try {
    const stat = statSync(path);
    const expDate = stat.birthtime.getTime() + parseInt(duration + '00');
    const currentTime = new Date().getTime();
    if (expDate < currentTime) {
      unlinkSync(path);
      return undefined;
    }
    const data = readFileSync(path, { encoding: 'utf-8' });
    return JSON.parse(data);
  } catch (error) {
    return undefined;
  }
};
export const saveJSONCache = (type: ECache, content: any) => {
  const path = getPath(type);
  writeFileSync(path, JSON.stringify(content));
};
export const deleteJSONCache = (type: ECache) => {
  const path = getPath(type);
  unlinkSync(path);
};
export const getOrSetJSONCache = async (type: ECache, getContent: () => Promise<any>) => {
  const cached = getJSONCache(type);
  if (cached !== undefined) {
    return cached;
  }
  const content = await getContent();
  saveJSONCache(type, content);
  return content;
};
export const clearAllCache = () => {
  for (const item of Object.values(ECache)) {
    const path = getPath(item as ECache);
    try {
      unlinkSync(path);
    } catch (error) {}
  }
};
