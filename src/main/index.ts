import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import {
  getAllCategory,
  getAllCountry,
  getAllLanguage,
  getFilteredActiveChannel,
  getSingleChannelWithStream
} from './iptv';
import config from './config';
import { FILTER_TYPE } from '../preload/iptv.type';

function createWindow(path: string): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  });

  // CORS
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders: { [key: string]: string | string[] } = {};

    for (const key in details.responseHeaders) {
      if (
        key.toLowerCase() !== 'access-control-allow-origin' &&
        key.toLowerCase() !== 'access-control-allow-headers'
      ) {
        responseHeaders[key] = details.responseHeaders[key];
      }
    }

    responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    responseHeaders['Access-Control-Allow-Headers'] = ['*'];

    var statusLine: string | undefined = undefined;
    if (details.method === 'OPTIONS') {
      statusLine = 'HTTP/1.1 200 OK';
    }
    callback({
      responseHeaders,
      statusLine
    });
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/' + path);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/' + path));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.hasanfirdaus.iptv.desktop');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.configureHostResolver({
    secureDnsMode: 'secure',
    secureDnsServers: ['https://chrome.cloudflare-dns.com/dns-query']
  });

  // IPC test
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

  const iptvView = config.data.iptvView;
  var hash = '#home/' + iptvView.filter;
  if (iptvView.code) {
    hash = hash + '/' + iptvView.code;
  }

  const homePath = 'index.html' + hash;

  createWindow(homePath);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow(homePath);
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
