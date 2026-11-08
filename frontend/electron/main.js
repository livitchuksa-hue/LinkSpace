const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { registerFilesystemIpc } = require('./ipc/filesystem');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const useViteDevServer = process.env.ELECTRON_DEV === '1';

/** @type {BrowserWindow | null} */
let mainWindow = null;

/**
 * Точка расширения: в будущем здесь можно запускать Java-сервер
 * (JAR или Maven Wrapper) и останавливать его при закрытии приложения.
 * На этапе каркаса backend в режиме разработки стартует отдельно.
 */
function ensureBackendProcess() {
  // Reserved for automatic Spring Boot lifecycle management.
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0f1115',
    title: 'Linkspace',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (useViteDevServer) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.error('dist/index.html not found. Run "npm run build" or use "npm run electron:dev".');
    }
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerFilesystemIpc();
  ensureBackendProcess();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
