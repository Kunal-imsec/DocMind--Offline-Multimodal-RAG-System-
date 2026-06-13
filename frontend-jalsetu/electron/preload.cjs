const { contextBridge, ipcRenderer } = require('electron');


// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // App info
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Platform info
    platform: process.platform,

    // Future IPC methods can be added here
    // Example: saveFile: (data) => ipcRenderer.invoke('save-file', data),
});

// Expose electron-store if needed
// This would require additional setup with electron-store
contextBridge.exposeInMainWorld('store', {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
});
