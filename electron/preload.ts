import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('downer', {
  openWidget: (eventId: string, size: 'small'|'medium'|'large', mode: 'float'|'desktop') =>
    ipcRenderer.invoke('widget:open', { eventId, size, mode }),
  closeWidget: (eventId: string) => ipcRenderer.invoke('widget:close', eventId),
  updateWidget: (eventId: string, payload: { size?: 'small'|'medium'|'large'; mode?: 'float'|'desktop' }) =>
    ipcRenderer.invoke('widget:update', { eventId, ...payload }),

  setWindowSize: (payload: { width: number; height: number }) =>
    ipcRenderer.invoke('window:setSize', payload),

  broadcastStore: (snapshot: unknown) => ipcRenderer.send('store:broadcast', snapshot),
  onStoreSnapshot: (cb: (snapshot: any) => void) => {
    ipcRenderer.on('store:snapshot', (_e, s) => cb(s));
  },
  notifyWidgetReady: () => ipcRenderer.send('widget:ready'),
  onWidgetClosed: (cb: (eventId: string) => void) => {
    ipcRenderer.on('widget-closed', (_e, id) => cb(id));
  },
});
