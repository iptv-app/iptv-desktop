import { FILTER_TYPE } from '../preload/iptv.type';
import {
  getAllCategory,
  getAllCountry,
  getAllLanguage,
  getFilteredActiveChannel,
  getSingleChannelWithStream
} from './iptv';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { clearAllCache } from './cache';
import config, { defaultAppConifg } from './config';
import { AppConfig } from '../preload/config.type';
import { setupDOH } from './network';

export const registerCoreIPC = () => {
  ipcMain.handle('getAllCountry', getAllCountry);
  ipcMain.handle('getAllCategory', getAllCategory);
  ipcMain.handle('getAllLanguage', getAllLanguage);
  ipcMain.handle('getFilteredActiveChannel', (_e, type, code) =>
    getFilteredActiveChannel(type, code)
  );
  ipcMain.handle('getSingleChannelWithStream', (_e, channel) =>
    getSingleChannelWithStream(channel)
  );
  ipcMain.handle('setIptvView', (_e, type: FILTER_TYPE, code: string) => {
    config.data.iptvView.filter = type;
    config.data.iptvView.code = code;
    config.write();
  });
  ipcMain.handle('getIptvView', () => config.data.iptvView);
  ipcMain.handle('getAppConfig', () =>
    config.chain.get('app').defaultsDeep(defaultAppConifg).value()
  );
};

export const registerWindowIPC = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.executeJavaScript(
    `window.__appConfig = ${JSON.stringify(config.chain.get('app').defaultsDeep(defaultAppConifg).value())};`
  );
  ipcMain.handle('clearAllCache', () => {
    const res = dialog.showMessageBoxSync(mainWindow, {
      title: 'Clear Cache',
      message: 'Are you sure want to delete all cache?',
      type: 'question',
      buttons: ['Cancel', 'Yes'],
      cancelId: 0
    });
    if (res === 1) {
      clearAllCache();
      dialog.showMessageBoxSync(mainWindow, {
        message: 'Cache Cleared!',
        type: 'info'
      });
    }
  });
  ipcMain.handle('setAppConfig', (_e, newCfg: AppConfig['app']) => {
    config.data.app = newCfg;
    config.write();
    setupDOH(app, newCfg);
    mainWindow.webContents.executeJavaScript(
      `window.__appConfig = ${JSON.stringify(config.chain.get('app').defaultsDeep(defaultAppConifg).value())};`
    );
    dialog.showMessageBoxSync(mainWindow, {
      message: 'Settings Saved!',
      type: 'info'
    });
  });
};
