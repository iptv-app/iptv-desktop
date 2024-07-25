import { ElectronAPI } from '@electron-toolkit/preload';
import type { API } from './api.type';
import { AppConfig } from './config.type';

declare global {
  interface Window {
    api: API;
    __appConfig: readonly AppConfig['app'];
  }
}
