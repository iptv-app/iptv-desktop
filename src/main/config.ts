import { JSONFileSyncPreset } from 'lowdb/node';
import { FILTER_TYPE } from '../preload/iptv.type';
import { app } from 'electron';
import { join } from 'path';

type Config = {
  iptvView: {
    filter: FILTER_TYPE;
    code?: string;
  };
};
const initialValue: Config = {
  iptvView: {
    filter: 'country'
  }
};
const path = join(app.getPath('userData'), 'APPCONFIG.json');
const config = JSONFileSyncPreset<Config>(path, initialValue);
export default config;
