import { BrowserWindow } from 'electron';
import { AppConfig } from '../preload/config.type';

export const bypassCORS = (mainWindow: BrowserWindow) => {
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
};
export const customHeader = (mainWindow: BrowserWindow) => {
  const removeDefaultHeader = ['referer', 'origin'];
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    const baseHeader: Record<string, string | string[]> = {};
    const overrideHeader: Record<string, string | string[]> = {};
    for (const key in details.requestHeaders) {
      if (key.toLowerCase().startsWith('x-custom-')) {
        const newKey = key.substring(9);
        overrideHeader[newKey] = details.requestHeaders[key];
      } else {
        if (!removeDefaultHeader.includes(key.toLowerCase())) {
          baseHeader[key] = details.requestHeaders[key];
        }
      }
    }
    const requestHeaders = { ...baseHeader, ...overrideHeader };
    callback({ cancel: false, requestHeaders });
  });
};
export const setupDOH = (app: Electron.App, config: AppConfig['app']) => {
  if (config?.network?.isUseDOH) {
    app.configureHostResolver({
      secureDnsMode: 'secure',
      secureDnsServers: config.network.dohResolverUrl ? [config.network.dohResolverUrl] : undefined
    });
  } else {
    app.configureHostResolver({
      secureDnsMode: 'off'
    });
  }
};
