import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('downer', {
  openWidget: (eventId: string, size: 'small'|'medium'|'large', mode: 'float'|'desktop', x?: number, y?: number) =>
    ipcRenderer.invoke('widget:open', { eventId, size, mode, x, y }),
  closeWidget: (eventId: string) => ipcRenderer.invoke('widget:close', eventId),
  updateWidget: (eventId: string, payload: { size?: 'small'|'medium'|'large'; mode?: 'float'|'desktop' }) =>
    ipcRenderer.invoke('widget:update', { eventId, ...payload }),

  setWindowSize: (payload: { width: number; height: number }) =>
    ipcRenderer.invoke('window:setSize', payload),

  setLaunchAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke('app:setLaunchAtLogin', enabled),

  showNotification: (payload: { title: string; body: string; silent?: boolean }) =>
    ipcRenderer.invoke('app:showNotification', payload),

  broadcastStore: (snapshot: unknown) => ipcRenderer.send('store:broadcast', snapshot),
  onStoreSnapshot: (cb: (snapshot: any) => void) => {
    ipcRenderer.on('store:snapshot', (_e, s) => cb(s));
  },
  notifyWidgetReady: () => ipcRenderer.send('widget:ready'),
  onWidgetClosed: (cb: (eventId: string) => void) => {
    ipcRenderer.on('widget-closed', (_e, id) => cb(id));
  },
  onWidgetMoved: (cb: (eventId: string, x: number, y: number) => void) => {
    ipcRenderer.on('widget-moved', (_e, id, x, y) => cb(id, x, y));
  },
  /** Toggle click-through for the calling widget window. Pass true to let clicks
   *  fall through to apps behind the widget; false to allow drag interaction. */
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.send('widget:ignore-mouse', ignore),

  // ── Auto-updater ──────────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate:  () => ipcRenderer.invoke('updater:download'),
  installUpdate:   () => ipcRenderer.invoke('updater:install'),
  onUpdateAvailable:   (cb: (info: any) => void) => ipcRenderer.on('updater:update-available', (_e, i) => cb(i)),
  onUpdateUpToDate:    (cb: () => void)           => ipcRenderer.on('updater:up-to-date', () => cb()),
  onUpdateProgress:    (cb: (pct: number) => void) => ipcRenderer.on('updater:progress', (_e, p) => cb(p)),
  onUpdateDownloaded:  (cb: (info: any) => void) => ipcRenderer.on('updater:downloaded', (_e, i) => cb(i)),
  onUpdaterError:      (cb: (msg: string) => void) => ipcRenderer.on('updater:error', (_e, m) => cb(m)),
});
