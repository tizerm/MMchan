const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('accessApi', {
    readPrefAccs: () => ipcRenderer.invoke('read-pref-accs'),
    readPrefCols: () => ipcRenderer.invoke('read-pref-cols'),
    readCustomEmojis: () => ipcRenderer.invoke('read-pref-emojis'),
    readHistory: () => ipcRenderer.invoke('read-history'),
    writePrefMstdAccs: (json_data) => ipcRenderer.send('write-pref-mstd-accs', json_data),
    writePrefMskyAccs: (json_data) => ipcRenderer.send('write-pref-msky-accs', json_data),
    writePrefAccColor: (json_data) => ipcRenderer.send('write-pref-acc-color', json_data),
    writePrefCols: (json_data) => ipcRenderer.send('write-pref-cols', json_data),
    writeCustomEmojis: (json_data) => ipcRenderer.send('write-pref-emojis', json_data),
    cacheHistory: (json_data) => ipcRenderer.send('cache-history', json_data),
    openExternalBrowser: (url) => ipcRenderer.send('open-external-browser', url),
    notification: (arg) => ipcRenderer.send('notification', arg)
})
