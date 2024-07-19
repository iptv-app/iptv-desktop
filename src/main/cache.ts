import { app } from 'electron';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const PREFIX = 'APPCACHE_';
const getPath = (slug: string) => join(app.getPath('userData'), PREFIX + slug + '.json');
export const getJSONCache = (slug: string) => {
  const path = getPath(slug);
  try {
    const data = readFileSync(path, { encoding: 'utf-8' });
    return JSON.parse(data);
  } catch (error) {
    return undefined;
  }
};
export const saveJSONCache = (slug: string, content: any) => {
  const path = getPath(slug);
  writeFileSync(path, JSON.stringify(content));
};
export const deleteJSONCache = (slug: string) => {
  const path = getPath(slug);
  unlinkSync(path);
};
export const getOrSetJSONCache = async (slug: string, getContent: () => Promise<any>) => {
  const cached = getJSONCache(slug);
  if (cached !== undefined) {
    return cached;
  }
  const content = await getContent();
  saveJSONCache(slug, content);
  return content;
};
