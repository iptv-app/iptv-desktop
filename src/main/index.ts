import { app, shell, BrowserWindow, nativeTheme } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import config, { defaultAppConifg } from './config';
import { bypassCORS, customHeader, setupDOH } from './network';
import { IPCHandler } from './ipc';

app.commandLine.appendSwitch('lang', 'en-US');
nativeTheme.themeSource = 'dark';
const ipcHandler = new IPCHandler();

const createMainWindow = async (hash: string) => {
  const isSystemTitleBar = config.chain
    .get(
      'app.userInterface.isUseSystemTitlebar',
      defaultAppConifg?.userInterface?.isUseSystemTitlebar
    )
    .value();

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    show: false,
    darkTheme: true,
    backgroundColor: '#0a0a12',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    },
    titleBarStyle: isSystemTitleBar ? 'default' : 'hidden',
    titleBarOverlay: isSystemTitleBar
      ? undefined
      : {
          color: '#0a0a12',
          symbolColor: '#ffffff',
          height: 30
        }
  });
  ipcHandler.setMainWindow(mainWindow);

  bypassCORS(mainWindow);
  customHeader(mainWindow);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/index.html#' + hash);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash });
  }
  mainWindow.show();
};
ipcHandler.setCreateMainWindow(createMainWindow);

app.on('ready', () => {
  electronApp.setAppUserModelId('app.iptv.desktop');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  setupDOH(app, config.data.app);
  ipcHandler.registerIPC();

  const iptvView = config.data.iptvView;
  var hash = 'home/' + iptvView.filter;
  if (iptvView.code) {
    hash = hash + '/' + iptvView.code;
  }

  createMainWindow(hash);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(hash);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
