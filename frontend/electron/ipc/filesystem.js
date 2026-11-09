const { dialog, ipcMain, shell } = require('electron');
const fs = require('fs/promises');
const path = require('path');

/**
 * IPC-обработчики файловой системы.
 * Вся работа с ОС выполняется только в Main Process.
 */
function registerFilesystemIpc() {
  ipcMain.handle('fs:select-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Выберите файлы',
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }

    return result.filePaths;
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

  ipcMain.handle('fs:open-url', async (_event, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'Некорректный URL' };
    }
    await shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle('fs:stat', async (_event, targetPath) => {
    if (typeof targetPath !== 'string' || targetPath.trim() === '') {
      return { exists: false, path: targetPath };
    }

    try {
      const stats = await fs.stat(targetPath);
      return {
        exists: true,
        path: targetPath,
        name: path.basename(targetPath),
        disk: formatDisk(targetPath),
        isDirectory: stats.isDirectory(),
        fileSize: stats.size,
        fileCreatedAt: stats.birthtime.toISOString(),
        fileModifiedAt: stats.mtime.toISOString(),
      };
    } catch {
      return {
        exists: false,
        path: targetPath,
        name: path.basename(targetPath),
        disk: formatDisk(targetPath),
      };
    }
  });
}

function formatDisk(filePath) {
  const root = path.parse(filePath).root || '';
  const letter = root.replace(/[\\/]/g, '');
  return letter || root || null;
}

module.exports = { registerFilesystemIpc };
