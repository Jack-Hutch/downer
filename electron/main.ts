import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = !!DEV_URL;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const widgetWindows = new Map<string, BrowserWindow>();

function loadRoute(win: BrowserWindow, page: 'index' | 'widget', search = '') {
  if (isDev) {
    const file = page === 'index' ? '' : 'widget.html';
    win.loadURL(`${DEV_URL}/${file}${search}`);
  } else {
    win.loadFile(path.join(__dirname, `../dist/${page === 'index' ? 'index' : 'widget'}.html`), {
      search: search.replace(/^\?/, ''),
    });
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#faf8f3',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRoute(mainWindow, 'index');
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createWidgetWindow(eventId: string, size: 'small' | 'medium' | 'large', alwaysOnTop: boolean) {
  if (widgetWindows.has(eventId)) {
    widgetWindows.get(eventId)?.focus();
    return;
  }
  const dims = {
    small: { width: 220, height: 130 },
    medium: { width: 280, height: 170 },
    large: { width: 340, height: 210 },
  }[size];

  const display = screen.getPrimaryDisplay().workArea;
  const offset = widgetWindows.size * 24;

  const win = new BrowserWindow({
    width: dims.width,
    height: dims.height,
    x: display.x + display.width - dims.width - 40 - offset,
    y: display.y + 40 + offset,
    frame: false,
    transparent: true,
    alwaysOnTop,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (alwaysOnTop) win.setAlwaysOnTop(true, 'floating');
  loadRoute(win, 'widget', `?eventId=${encodeURIComponent(eventId)}`);
  widgetWindows.set(eventId, win);
  win.on('closed', () => {
    widgetWindows.delete(eventId);
    mainWindow?.webContents.send('widget-closed', eventId);
  });
}

function buildTrayIcon() {
  const img = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAa0lEQVR42mNgGAWjYBSMglEwCgYHYIGgEvFhIFv+Ax3yGRgYGRgYGRiQjGRkY2BgYGRgYGBgZGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGAAAOFEBwxq2eb9AAAAAElFTkSuQmCC'
  );
  img.setTemplateImage(true);
  return img;
}

function createTray() {
  tray = new Tray(buildTrayIcon());
  tray.setToolTip('Downer');
  tray.on('click', () => {
    if (!mainWindow) createMainWindow();
    else if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
  tray.on('right-click', () => {
    const menu = Menu.buildFromTemplate([
      { label: 'Open Downer', click: () => mainWindow?.show() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]);
    tray?.popUpContextMenu(menu);
  });
}

ipcMain.handle('widget:open', (_e, payload: { eventId: string; size: 'small'|'medium'|'large'; alwaysOnTop: boolean }) => {
  createWidgetWindow(payload.eventId, payload.size, payload.alwaysOnTop);
});
ipcMain.handle('widget:close', (_e, eventId: string) => {
  widgetWindows.get(eventId)?.close();
});
ipcMain.handle('widget:update', (_e, payload: { eventId: string; size?: 'small'|'medium'|'large'; alwaysOnTop?: boolean }) => {
  const win = widgetWindows.get(payload.eventId);
  if (!win) return;
  if (payload.size) {
    const d = { small: { w: 220, h: 130 }, medium: { w: 280, h: 170 }, large: { w: 340, h: 210 } }[payload.size];
    win.setSize(d.w, d.h);
  }
  if (typeof payload.alwaysOnTop === 'boolean') {
    win.setAlwaysOnTop(payload.alwaysOnTop, payload.alwaysOnTop ? 'floating' : 'normal');
  }
});

// Widget renderer pulls store data via IPC
ipcMain.handle('store:get', () => {
  return new Promise(resolve => {
    if (!mainWindow) return resolve(null);
    mainWindow.webContents.send('store:request');
    ipcMain.once('store:reply', (_e, data) => resolve(data));
  });
});

// Broadcast store updates from main renderer to all widgets
ipcMain.on('store:broadcast', (_e, snapshot) => {
  for (const w of widgetWindows.values()) w.webContents.send('store:snapshot', snapshot);
});

app.whenReady().then(() => {
  createMainWindow();
  try { createTray(); } catch { /* tray icon may fail in dev — non-fatal */ }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
