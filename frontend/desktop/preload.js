
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    getVersion: () => ipcRenderer.invoke('get-app-version'),

    getStore: (key) => ipcRenderer.invoke('get-store', key),
    setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),

});
