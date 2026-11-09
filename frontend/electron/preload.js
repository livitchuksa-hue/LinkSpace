const { contextBridge, ipcRenderer, webUtils } = require('electron');

/**
 * Ограниченный API для Renderer Process.
 * Произвольные IPC-каналы и Node.js API не экспортируются.
 */
contextBridge.exposeInMainWorld('linkspace', {
  selectFile: () => ipcRenderer.invoke('fs:select-file'),
  selectFolder: () => ipcRenderer.invoke('fs:select-folder'),
  openPath: (targetPath) => ipcRenderer.invoke('fs:open-path', targetPath),
  openUrl: (url) => ipcRenderer.invoke('fs:open-url', url),
  statPath: (targetPath) => ipcRenderer.invoke('fs:stat', targetPath),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return null;
    }
  },
});
