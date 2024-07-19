import { ElectronAPI } from '@electron-toolkit/preload';
import type { API } from './iptv.type';

declare global {
  interface Window {
    api: API;
  }
}
