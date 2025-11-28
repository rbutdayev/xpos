const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Config management
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),

    // Bridge control
    restartBridge: () => ipcRenderer.invoke('restart-bridge'),

    // Auto-launch
    getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
    setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),

    // Event listeners
    onBridgeOutput: (callback) => {
        ipcRenderer.on('bridge-output', (event, data) => callback(data));
    },

    onBridgeStopped: (callback) => {
        ipcRenderer.on('bridge-stopped', (event, code) => callback(code));
    },

    onBridgeLog: (callback) => {
        ipcRenderer.on('bridge-log', (event, data) => callback(data));
    },

    onShowSettings: (callback) => {
        ipcRenderer.on('show-settings', () => callback());
    },

    // Remove event listeners
    removeListener: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
