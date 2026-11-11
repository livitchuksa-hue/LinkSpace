const { app, BrowserWindow, nativeImage } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { registerFilesystemIpc } = require('./ipc/filesystem');
const { registerLinkPreviewIpc } = require('./ipc/linkPreview');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const useViteDevServer = process.env.ELECTRON_DEV === '1';
const BACKEND_URL = 'http://127.0.0.1:8080/api/objects';
const BACKEND_DIR = path.join(__dirname, '..', '..', 'backend');
const BACKEND_JAR = path.join(BACKEND_DIR, 'target', 'linkspace-backend-0.1.0-SNAPSHOT.jar');
const REPO_ROOT = path.join(__dirname, '..', '..');

function appIcon() {
  const candidates = [
    path.join(__dirname, '..', 'dist', 'app-icon.png'),
    path.join(__dirname, '..', 'public', 'app-icon.png'),
    path.join(REPO_ROOT, 'app-icon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return nativeImage.createFromPath(candidate);
    }
  }
  return undefined;
}

/** @type {BrowserWindow | null} */
let mainWindow = null;
let backendProcess = null;
let ownsBackendProcess = false;
let backendStartPromise = null;

function javaMajorVersion(javaHome) {
  try {
    const release = fs.readFileSync(path.join(javaHome, 'release'), 'utf8');
    const match = release.match(/JAVA_VERSION="([^"]+)"/);
    if (!match) return null;
    const version = match[1];
    // Формат "1.8.0_xxx" для старых JDK, "21.0.x" для новых
    return version.startsWith('1.')
      ? parseInt(version.split('.')[1], 10)
      : parseInt(version.split('.')[0], 10);
  } catch {
    return null;
  }
}

/**
 * Портативный JDK внутри проекта: <repo>/jdk, <repo>/backend/jdk
 * или путь из LINKSPACE_JDK. Нужен для машин, где системная Java
 * старше не позволяет запустить Spring Boot 3 (требуется 17+).
 */
function findBundledJdk() {
  const candidates = [
    process.env.LINKSPACE_JDK,
    path.join(REPO_ROOT, 'jdk'),
    path.join(REPO_ROOT, 'backend', 'jdk'),
  ].filter(Boolean);

  for (const dir of candidates) {
    const javaBin = path.join(dir, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (!fs.existsSync(javaBin)) continue;
    const major = javaMajorVersion(dir);
    if (major !== null && major >= 17) {
      console.log(`[backend] using bundled JDK ${major}: ${dir}`);
      return dir;
    }
  }
  return null;
}

function resolveJavaCommand(javaHome) {
  const candidates = [];
  if (javaHome) {
    candidates.push(path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'));
  }
  if (process.env.JAVA_HOME) {
    candidates.push(path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'));
  }
  candidates.push('java');
  return candidates.find((candidate) => candidate === 'java' || fs.existsSync(candidate)) || 'java';
}

async function isBackendRunning() {
  try {
    const response = await fetch(BACKEND_URL, {
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return Array.isArray(body);
  } catch {
    return false;
  }
}

function waitForBackend(timeoutMs = 90000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (await isBackendRunning()) {
        resolve();
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('Backend did not start in time'));
        return;
      }
      setTimeout(poll, 700);
    };
    poll();
  });
}

function spawnBackend() {
  const env = { ...process.env };
  const bundledJdk = findBundledJdk();
  if (bundledJdk) {
    env.JAVA_HOME = bundledJdk;
    env.PATH = `${path.join(bundledJdk, 'bin')}${path.delimiter}${env.PATH || ''}`;
  }
  let command;
  let args;

  const usePackagedJar = !useViteDevServer && fs.existsSync(BACKEND_JAR);
  if (usePackagedJar) {
    command = resolveJavaCommand(bundledJdk);
    args = ['-jar', BACKEND_JAR];
  } else {
    command = process.platform === 'win32' ? 'cmd.exe' : './mvnw';
    args = process.platform === 'win32'
      ? ['/d', '/s', '/c', 'mvnw.cmd spring-boot:run']
      : ['spring-boot:run'];
  }

  backendProcess = spawn(command, args, {
    cwd: BACKEND_DIR,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  ownsBackendProcess = true;

  backendProcess.stdout?.on('data', (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });
  backendProcess.stderr?.on('data', (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });
  backendProcess.on('error', (error) => {
    console.error('[backend] failed to start:', error);
  });
  backendProcess.on('exit', (code) => {
    ownsBackendProcess = false;
    backendProcess = null;
    if (code !== 0 && code !== null) {
      console.error(`[backend] exited with code ${code}`);
    }
  });
}

async function ensureBackendProcess() {
  if (await isBackendRunning()) return;
  if (backendStartPromise) return backendStartPromise;

  backendStartPromise = (async () => {
    spawnBackend();
    await waitForBackend();
  })().catch((error) => {
    console.error('[backend]', error.message);
  }).finally(() => {
    backendStartPromise = null;
  });

  return backendStartPromise;
}

function stopBackendProcess() {
  if (!ownsBackendProcess || !backendProcess) return;
  const child = backendProcess;
  backendProcess = null;
  ownsBackendProcess = false;

  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true });
  } else {
    child.kill('SIGTERM');
  }
}

function createWindow() {
  console.log('[electron] creating main window');
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0a0a',
    title: 'Linkspace',
    icon: appIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (useViteDevServer) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.error('dist/index.html not found. Run "npm run build" or use "npm run electron:dev".');
    }
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[electron] page finished loading:', mainWindow?.webContents.getURL());
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[electron] failed to load ${validatedURL}: ${errorCode} ${errorDescription}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[electron] render process gone:', details);
  });
  mainWindow.on('ready-to-show', () => {
    console.log('[electron] main window ready');
    mainWindow?.show();
  });
  mainWindow.on('close', () => {
    console.log('[electron] main window close event');
  });
  mainWindow.on('closed', () => {
    console.log('[electron] main window closed');
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('[electron] app ready');
  registerFilesystemIpc();
  registerLinkPreviewIpc();
  ensureBackendProcess();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', stopBackendProcess);
app.on('will-quit', stopBackendProcess);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
