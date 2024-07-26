import { FILTER_TYPE } from '../preload/iptv.type';
import {
  getAllCategory,
  getAllCountry,
  getAllLanguage,
  getFilteredActiveChannel,
  getSingleChannelWithStream
} from './iptv';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { clearAllCache } from './cache';
import config, { defaultAppConifg } from './config';
import { AppConfig } from '../preload/config.type';

export class IPCHandler {
  private _mainWindow?: BrowserWindow;
  private _createMainWindow?: (hash: string) => void;

  public setMainWindow(window: BrowserWindow) {
    this._mainWindow = window;
  }
  public setCreateMainWindow(fn: (hasn: string) => void) {
    this._createMainWindow = fn;
  }

  public registerIPC() {
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

    ipcMain.handle('clearAllCache', () => {
      this._needMainWindow();
      const res = dialog.showMessageBoxSync(this._mainWindow!, {
        title: 'Clear Cache',
        message: 'Are you sure want to delete all cache?',
        type: 'question',
        buttons: ['Cancel', 'Yes'],
        cancelId: 0
      });
      if (res === 1) {
        clearAllCache();
        dialog.showMessageBoxSync(this._mainWindow!, {
          message: 'Cache Cleared!',
          type: 'info'
        });
      }
    });
    ipcMain.handle('setAppConfig', (_e, newCfg: AppConfig['app'], relaunchHash: string) => {
      this._needMainWindow();
      this._needCreateWindow();
      config.data.app = newCfg;
      config.write();
      dialog.showMessageBoxSync(this._mainWindow!, {
        message: 'Settings Saved!',
        type: 'info'
      });
      this._mainWindow!.close();
      this._createMainWindow!(relaunchHash);
    });
  }

  private _needMainWindow() {
    if (this._mainWindow === undefined) {
      throw new Error('Main window not defined!');
    }
  }
  private _needCreateWindow() {
    if (this._createMainWindow === undefined) {
      throw new Error('Create window not defined!');
    }
  }
}
