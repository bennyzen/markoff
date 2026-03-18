const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('__ELECTRON__', {
	readFileText: path => ipcRenderer.invoke('read-file-text', path),
	readFileAsDataUrl: (baseDir, relativePath) => ipcRenderer.invoke('read-file-as-data-url', baseDir, relativePath),
	getPendingFile: () => ipcRenderer.invoke('get-pending-file'),
	quit: () => ipcRenderer.invoke('quit-app'),
})
