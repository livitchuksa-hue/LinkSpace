const { dialog, ipcMain, shell } = require('electron');
const fs = require('fs/promises');
const path = require('path');

/**
 * IPC-обработчики файловой системы.
 * Вся работа с ОС выполняется только в Main Process.
 */
function registerFilesystemIpc() {
  ipcMain.handle('fs:select-file', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      title: 'Выберите файлы',
      properties: ['openFile', 'multiSelections'],
      filters: Array.isArray(options?.filters) ? options.filters : undefined,
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

  ipcMain.handle('fs:read-text', async (_event, targetPath) => {
    if (typeof targetPath !== 'string' || targetPath.trim() === '') {
      return { ok: false, error: 'Path is required' };
    }

    const MAX_BYTES = 4 * 1024 * 1024;
    try {
      const stats = await fs.stat(targetPath);
      if (!stats.isFile()) return { ok: false, error: 'Not a file' };
      if (stats.size > MAX_BYTES) return { ok: false, error: 'File too large' };
      const text = await fs.readFile(targetPath, 'utf8');
      return { ok: true, text: text.slice(0, 1000000) };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('fs:write-text', async (_event, payload) => {
    const targetPath = typeof payload?.path === 'string' ? payload.path.trim() : '';
    const content = typeof payload?.content === 'string' ? payload.content : '';
    if (!targetPath) {
      return { ok: false, error: 'Path is required' };
    }

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, content, 'utf8');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('fs:read-data-url', async (_event, targetPath) => {
    if (typeof targetPath !== 'string' || targetPath.trim() === '') {
      return { ok: false, error: 'Path is required' };
    }

    const MAX_BYTES = 25 * 1024 * 1024;
    try {
      const stats = await fs.stat(targetPath);
      if (!stats.isFile()) return { ok: false, error: 'Not a file' };
      if (stats.size > MAX_BYTES) return { ok: false, error: 'File too large' };
      const buffer = await fs.readFile(targetPath);
      const mime = IMAGE_MIME[path.extname(targetPath).slice(1).toLowerCase()] || 'application/octet-stream';
      return { ok: true, dataUrl: `data:${mime};base64,${buffer.toString('base64')}` };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });
}

const IMAGE_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  avif: 'image/avif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

function formatDisk(filePath) {
  const root = path.parse(filePath).root || '';
  const letter = root.replace(/[\\/]/g, '');
  return letter || root || null;
}

module.exports = { registerFilesystemIpc };
