import { ElectronAPI } from '@electron-toolkit/preload';
import type { API } from './api.type';

declare global {
  interface Window {
    api: API;
  }
}
