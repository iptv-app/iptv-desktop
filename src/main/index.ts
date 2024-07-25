import { app, shell, BrowserWindow, nativeTheme } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import config from './config';
import { registerCoreIPC, registerWindowIPC } from './ipc';
import { bypassCORS, customHeader, setupDOH } from './network';

app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport');
nativeTheme.themeSource = 'dark';

function createWindow(path: string): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  });

  registerWindowIPC(mainWindow);
  bypassCORS(mainWindow);
  customHeader(mainWindow);

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
  electronApp.setAppUserModelId('app.iptv.desktop');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  setupDOH(app, config.data.app);
  registerCoreIPC();

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
