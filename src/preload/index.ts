import { contextBridge, ipcRenderer } from 'electron';
import { API } from './api.type';

const api: API = {
  getAllCountry: () => ipcRenderer.invoke('getAllCountry'),
  getAllCategory: () => ipcRenderer.invoke('getAllCategory'),
  getAllLanguage: () => ipcRenderer.invoke('getAllLanguage'),
  getFilteredActiveChannel: (type, code) =>
    ipcRenderer.invoke('getFilteredActiveChannel', type, code),
  getSingleChannelWithStream: (channelId) =>
    ipcRenderer.invoke('getSingleChannelWithStream', channelId),
  setIptvView: (filter, code) => ipcRenderer.invoke('setIptvView', filter, code)
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
