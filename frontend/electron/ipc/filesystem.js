const { dialog, ipcMain, shell } = require('electron');

/**
 * IPC-обработчики файловой системы.
 * Вся работа с ОС выполняется только в Main Process.
 */
function registerFilesystemIpc() {
  ipcMain.handle('fs:select-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Выберите файл',
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('fs:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Выберите папку',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('fs:open-path', async (_event, targetPath) => {
    if (typeof targetPath !== 'string' || targetPath.trim() === '') {
      return { ok: false, error: 'Path is required' };
    }

    const errorMessage = await shell.openPath(targetPath);
    if (errorMessage) {
      return { ok: false, error: errorMessage };
    }

    return { ok: true };
  });
}

module.exports = { registerFilesystemIpc };
