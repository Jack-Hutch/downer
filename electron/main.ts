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

type WidgetMode = 'float' | 'desktop';

function applyWidgetMode(win: BrowserWindow, mode: WidgetMode) {
  if (mode === 'float') {
    // Pinned ABOVE all other windows (classic widget behavior).
    win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setIgnoreMouseEvents(false);
    win.setFocusable(true);
  } else {
    // "Big Day Countdown" mode — sits ON the desktop, BEHIND all app windows.
    // Three things make this work on macOS:
    //   1. setAlwaysOnTop(true, 'desktop') — pins to the macOS desktop window level.
    //      The 'desktop' level isn't in Electron's typed list but it's accepted at
    //      runtime and maps to NSWindow's kCGDesktopWindowLevel-equivalent.
    //   2. setIgnoreMouseEvents(true, { forward: true }) — clicks pass through to
    //      whatever's underneath, just like a wallpaper element.
    //   3. setFocusable(false) — the widget never steals focus from your real apps.
    try {
      // @ts-expect-error 'desktop' is a valid runtime level on macOS even if not typed
      win.setAlwaysOnTop(true, 'desktop');
    } catch {
      win.setAlwaysOnTop(false);
    }
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setIgnoreMouseEvents(true, { forward: true });
    win.setFocusable(false);
  }
}

function createWidgetWindow(eventId: string, size: 'small' | 'medium' | 'large', mode: WidgetMode = 'desktop') {
  if (widgetWindows.has(eventId)) {
    const existing = widgetWindows.get(eventId)!;
    applyWidgetMode(existing, mode);
    if (mode === 'float') existing.focus();
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
    alwaysOnTop: mode === 'float',
    focusable: mode === 'float',
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [`--widget-mode=${mode}`],
    },
  });

  applyWidgetMode(win, mode);
  loadRoute(win, 'widget', `?eventId=${encodeURIComponent(eventId)}&mode=${mode}`);
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

ipcMain.handle('widget:open', (_e, payload: { eventId: string; size: 'small'|'medium'|'large'; mode: WidgetMode }) => {
  createWidgetWindow(payload.eventId, payload.size, payload.mode);
});
ipcMain.handle('widget:close', (_e, eventId: string) => {
  widgetWindows.get(eventId)?.close();
});
ipcMain.handle('window:setSize', (_e, payload: { width: number; height: number }) => {
  if (!mainWindow) return;
  // Clamp to sane bounds.
  const w = Math.max(800, Math.min(3840, Math.round(payload.width)));
  const h = Math.max(600, Math.min(2400, Math.round(payload.height)));
  mainWindow.setSize(w, h, true /* animate */);
  mainWindow.center();
});

ipcMain.handle('widget:update', (_e, payload: { eventId: string; size?: 'small'|'medium'|'large'; mode?: WidgetMode }) => {
  const win = widgetWindows.get(payload.eventId);
  if (!win) return;
  if (payload.size) {
    const d = { small: { w: 220, h: 130 }, medium: { w: 280, h: 170 }, large: { w: 340, h: 210 } }[payload.size];
    win.setSize(d.w, d.h);
  }
  if (payload.mode) {
    applyWidgetMode(win, payload.mode);
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
