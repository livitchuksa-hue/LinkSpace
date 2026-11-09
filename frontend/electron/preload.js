const { contextBridge, ipcRenderer, webUtils } = require('electron');

/**
 * Ограниченный API для Renderer Process.
 * Произвольные IPC-каналы и Node.js API не экспортируются.
 */
contextBridge.exposeInMainWorld('linkspace', {
  selectFile: (options) => ipcRenderer.invoke('fs:select-file', options),
  selectFolder: () => ipcRenderer.invoke('fs:select-folder'),
  openPath: (targetPath) => ipcRenderer.invoke('fs:open-path', targetPath),
  openUrl: (url) => ipcRenderer.invoke('fs:open-url', url),
  statPath: (targetPath) => ipcRenderer.invoke('fs:stat', targetPath),
  readDataUrl: (targetPath) => ipcRenderer.invoke('fs:read-data-url', targetPath),
  readText: (targetPath) => ipcRenderer.invoke('fs:read-text', targetPath),
  writeText: (targetPath, content) => ipcRenderer.invoke('fs:write-text', { path: targetPath, content }),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return null;
    }
  },
});
