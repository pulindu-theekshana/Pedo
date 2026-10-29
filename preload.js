const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  openFiles: () => ipcRenderer.invoke('open-files'),
  getInitialFiles: () => ipcRenderer.invoke('get-initial-files'),
  onOpenFiles: (cb) => ipcRenderer.on('open-files', (e, files) => cb(files))
});