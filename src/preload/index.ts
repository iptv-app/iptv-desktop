import { contextBridge, ipcRenderer } from 'electron';
import { API, FILTER_TYPE } from './iptv.type';

const api: API = {
  getAllCountry: () => ipcRenderer.invoke('getAllCountry'),
  getAllCategory: () => ipcRenderer.invoke('getAllCategory'),
  getAllLanguage: () => ipcRenderer.invoke('getAllLanguage'),
  getFilteredActiveChannel: (type: FILTER_TYPE, code: string) =>
    ipcRenderer.invoke('getFilteredActiveChannel', type, code)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api;
}
