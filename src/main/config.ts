import { JSONFileSync } from 'lowdb/node';
import { LowSync } from 'lowdb';
import { app } from 'electron';
import { join } from 'path';
import { AppConfig } from '../preload/config.type';
import lodash from 'lodash';

export const defaultAppConifg: AppConfig['app'] = {
  iptv: {
    isOverrideApi: false,
    apiUrl: 'https://iptv-org.github.io/api',
    cacheDuration: 60 * 60 * 24,
    isUseAltChannelName: true
  },
  network: {
    isUseDOH: false,
    dohResolverUrl: 'https://chrome.cloudflare-dns.com/dns-query'
  },
  caption: {
    isAutoShow: true,
    isEnableCEA708: true
  },
  userInterface: {
    isUseSystemTitlebar: process.platform === 'linux' ? true : false
  }
};

const initialValue: AppConfig = {
  iptvView: {
    filter: 'country'
  },
  app: undefined
};
class LowWithLodash<T> extends LowSync<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data');
}
const path = join(app.getPath('userData'), 'APPCONFIG.json');
const adapter = new JSONFileSync<AppConfig>(path);
const config = new LowWithLodash(adapter, initialValue);
config.read();
export default config;
