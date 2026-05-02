import { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage, screen } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = !!DEV_URL;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const widgetWindows = new Map<string, BrowserWindow>();
// Tracks the current mode of each widget window so we know when a mode change
// requires tearing down and recreating the window (window type is immutable).
const widgetModes = new Map<string, WidgetMode>();
// IDs of widgets currently being recreated for a mode switch — suppresses the
// spurious 'widget-closed' IPC that would incorrectly tell the renderer the
// widget was dismissed by the user.
const recreatingWidgets = new Set<string>();

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
  // Always visible across every Space, including full-screen app Spaces.
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Both modes are fully focusable, fully interactive, fully draggable.
  // The ONLY difference between them is whether the widget floats above
  // every other window, or sits at normal window level.
  //
  // We deliberately DON'T use setIgnoreMouseEvents or setFocusable(false)
  // for desktop mode — on macOS Sequoia, that combination plus transparent +
  // frameless can make the window server skip rendering the window entirely.
  // Reliable visibility beats the fancy click-through trick.
  win.setIgnoreMouseEvents(false);
  win.setFocusable(true);

  if (mode === 'float') {
    // Pinned ABOVE all other windows — classic always-on-top widget.
    win.setAlwaysOnTop(true, 'floating');
  } else {
    // Desktop mode — normal window level. Layered behind apps that come forward.
    win.setAlwaysOnTop(false);
  }
}

function createWidgetWindow(
  eventId: string,
  size: 'small' | 'medium' | 'large',
  mode: WidgetMode = 'desktop',
  position?: { x: number; y: number },
) {
  if (widgetWindows.has(eventId)) {
    const existing = widgetWindows.get(eventId)!;
    const existingMode = widgetModes.get(eventId);

    if (existingMode === mode) {
      // Same mode — nothing structural to change; just surface the window if floating.
      if (mode === 'float') existing.focus();
      return;
    }

    // Mode has changed.  Window options like alwaysOnTop / focusable can't be reliably
    // patched at runtime for all modes, so tear down the old window and rebuild it.
    // Save the current on-screen position so the new window appears in the same spot.
    const [cx, cy] = existing.getPosition();
    position = position ?? { x: cx, y: cy };

    // Mark as recreating so the 'closed' handler below doesn't send a false
    // 'widget-closed' IPC that would make the renderer think the user dismissed it.
    recreatingWidgets.add(eventId);
    existing.destroy();
    // widgetWindows / widgetModes are cleaned up synchronously inside the 'closed' handler.
  }

  const dims = {
    small:  { width: 220, height: 130 },
    medium: { width: 280, height: 170 },
    large:  { width: 340, height: 210 },
  }[size];

  const display = screen.getPrimaryDisplay().workArea;
  const offset  = widgetWindows.size * 24;

  const x = position?.x ?? (display.x + display.width  - dims.width  - 40 - offset);
  const y = position?.y ?? (display.y + 40 + offset);

  // Build window options.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winOpts: Record<string, any> = {
    width:        dims.width,
    height:       dims.height,
    x,
    y,
    frame:        false,
    transparent:  true,
    alwaysOnTop:  mode === 'float',
    focusable:    true,  // both modes — see applyWidgetMode comment
    resizable:    false,
    skipTaskbar:  true,
    show:         false, // shown via ready-to-show to avoid flash of empty content
    hasShadow:    false, // CSS handles the shadow for both modes
    backgroundColor: '#00000000',
    webPreferences: {
      preload:             path.join(__dirname, 'preload.js'),
      contextIsolation:    true,
      nodeIntegration:     false,
      additionalArguments: [`--widget-mode=${mode}`],
    },
  };

  const win = new BrowserWindow(winOpts);

  applyWidgetMode(win, mode);
  loadRoute(win, 'widget', `?eventId=${encodeURIComponent(eventId)}&mode=${mode}`);
  widgetWindows.set(eventId, win);
  widgetModes.set(eventId, mode);

  // Show once content is rendered, to avoid a flash of empty transparent content.
  // We use show() for both modes — showInactive() on a transparent borderless
  // window has been observed to silently no-op on macOS Sequoia, leaving the
  // widget invisible. show() reliably puts the window on screen.
  win.once('ready-to-show', () => {
    win.show();
  });

  // Belt-and-braces fallback: if 'ready-to-show' doesn't fire within 2s
  // (rare, but possible if the renderer crashes silently), force-show anyway
  // so the user always sees the widget on screen.
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      console.warn(`[widget] ready-to-show didn't fire in 2s, force-showing id=${eventId}`);
      win.show();
    }
  }, 2000);

  // Diagnostic — visible in Console.app under "Downer" if the user needs to verify
  // that widget creation is actually happening (e.g. when troubleshooting).
  console.log(`[widget] created id=${eventId} mode=${mode} size=${size} pos=(${x},${y}) dims=${dims.width}x${dims.height}`);
  win.webContents.once('did-finish-load', () => {
    console.log(`[widget] loaded id=${eventId} bounds=`, win.getBounds());
  });

  // Notify the main renderer whenever the user moves this widget so the new
  // position can be persisted in the store and restored on next launch.
  win.on('moved', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const [x, y] = win.getPosition();
    mainWindow.webContents.send('widget-moved', eventId, x, y);
  });

  win.on('closed', () => {
    widgetWindows.delete(eventId);
    widgetModes.delete(eventId);
    if (recreatingWidgets.has(eventId)) {
      // Window was destroyed as part of a mode switch — not a user dismissal.
      recreatingWidgets.delete(eventId);
    } else {
      mainWindow?.webContents.send('widget-closed', eventId);
    }
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

ipcMain.handle('widget:open', (_e, payload: { eventId: string; size: 'small'|'medium'|'large'; mode: WidgetMode; x?: number; y?: number }) => {
  const pos = (payload.x != null && payload.y != null) ? { x: payload.x, y: payload.y } : undefined;
  createWidgetWindow(payload.eventId, payload.size, payload.mode, pos);
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

// Toggle whether Downer launches automatically at login.
ipcMain.handle('app:setLaunchAtLogin', (_e, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: false });
});

// Fire a native macOS notification. Uses Electron's Notification API which
// surfaces as a real Notification Center entry, not a renderer-only banner.
ipcMain.handle('app:showNotification', (_e, payload: { title: string; body: string; silent?: boolean }) => {
  if (!Notification.isSupported()) return;
  const n = new Notification({
    title: payload.title,
    body: payload.body,
    silent: !!payload.silent,
  });
  n.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
  n.show();
});

ipcMain.handle('widget:update', (_e, payload: { eventId: string; size?: 'small'|'medium'|'large'; mode?: WidgetMode }) => {
  const win = widgetWindows.get(payload.eventId);
  if (!win) return;

  const currentMode = widgetModes.get(payload.eventId) ?? 'desktop';
  const newMode     = payload.mode ?? currentMode;

  if (payload.mode && payload.mode !== currentMode) {
    // Mode switch: BrowserWindow type can't be changed at runtime, so we need to
    // recreate the window.  Derive the target size from the payload or the current
    // window dimensions so the new window matches what the user selected.
    const [w]      = win.getSize();
    const sizeKey: 'small' | 'medium' | 'large' =
      payload.size ?? (w <= 220 ? 'small' : w <= 280 ? 'medium' : 'large');
    createWidgetWindow(payload.eventId, sizeKey, newMode);
    return; // createWidgetWindow handles position preservation and cleanup
  }

  // Same mode — just resize if requested.
  if (payload.size) {
    const d = { small: { w: 220, h: 130 }, medium: { w: 280, h: 170 }, large: { w: 340, h: 210 } }[payload.size];
    win.setSize(d.w, d.h);
  }
});

// Widget renderer calls this to toggle per-pixel click-through for desktop mode.
// When the mouse is over the transparent padding, ignore=true lets clicks fall
// through to the desktop.  When the mouse enters the opaque card area, ignore=false
// re-enables interaction (including the -webkit-app-region drag gesture).
ipcMain.on('widget:ignore-mouse', (e, ignore: boolean) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  if (ignore) {
    win.setIgnoreMouseEvents(true, { forward: true });
  } else {
    win.setIgnoreMouseEvents(false);
  }
});

// Cache the latest store snapshot in main so newly-created widget windows can
// pull it on mount instead of racing the next state-change broadcast.
let latestSnapshot: unknown = null;

// Broadcast store updates from main renderer to all widgets, AND cache.
ipcMain.on('store:broadcast', (_e, snapshot) => {
  latestSnapshot = snapshot;
  for (const w of widgetWindows.values()) {
    if (!w.isDestroyed() && !w.webContents.isDestroyed()) {
      w.webContents.send('store:snapshot', snapshot);
    }
  }
});

// Widget windows call this on mount to ask for the latest snapshot directly,
// avoiding the race where the broadcast happens before the new widget's webContents
// has finished loading and registered its IPC listener.
ipcMain.on('widget:ready', (e) => {
  if (latestSnapshot) {
    e.sender.send('store:snapshot', latestSnapshot);
  }
});

// ── Auto-updater ────────────────────────────────────────────────────────────
// Disable auto-download so the user chooses when to apply an update.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('updater:update-available', info);
});
autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('updater:up-to-date');
});
autoUpdater.on('download-progress', (p) => {
  mainWindow?.webContents.send('updater:progress', Math.round(p.percent));
});
autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('updater:downloaded', info);
});
autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('updater:error', err.message);
});

ipcMain.handle('updater:check', async () => {
  if (isDev) return { status: 'dev' };
  try {
    await autoUpdater.checkForUpdates();
    return { status: 'checking' };
  } catch (e: any) {
    return { status: 'error', message: e.message };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate();
  } catch { /* handled by error event */ }
});

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall();
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
