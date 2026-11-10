/**
 * Проверка и доскачивание бинарника Electron.
 *
 * На некоторых машинах (корпоративные/колледжные ПК) postinstall-скрипт
 * пакета `electron` не отрабатывает: глобальный `ignore-scripts`,
 * заблокированный github.com (откуда качается бинарник) и т.п.
 * Тогда `require('electron')` падает с «Electron failed to install
 * correctly». Этот модуль лечит проблему при запуске.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '..');
const ELECTRON_DIR = path.join(FRONTEND_DIR, 'node_modules', 'electron');
const DIST_DIR = path.join(ELECTRON_DIR, 'dist');
const INSTALL_JS = path.join(ELECTRON_DIR, 'install.js');

function isElectronInstalled() {
  try {
    if (!fs.existsSync(INSTALL_JS)) return false;
    return fs.existsSync(DIST_DIR) && fs.readdirSync(DIST_DIR).length > 0;
  } catch {
    return false;
  }
}

function ensureElectronBinary() {
  if (isElectronInstalled()) return true;

  if (!fs.existsSync(INSTALL_JS)) {
    console.error('[electron] пакет electron не найден в node_modules — выполните npm install');
    return false;
  }

  console.log('[electron] бинарник Electron не найден, скачиваю...');
  const env = { ...process.env };
  // npmmirror — зеркало Electron для сетей, где github.com заблокирован
  if (!env.ELECTRON_MIRROR) {
    env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/';
  }

  const result = spawnSync(process.execPath, [INSTALL_JS], {
    cwd: ELECTRON_DIR,
    stdio: 'inherit',
    env,
  });

  if (result.status === 0 && isElectronInstalled()) {
    console.log('[electron] бинарник установлен');
    return true;
  }

  console.error('[electron] не удалось скачать бинарник Electron.');
  console.error('  Повторите вручную: cd node_modules\\electron && node install.js');
  console.error('  Если github.com недоступен — будет использовано зеркало npmmirror.');
  console.error('  Можно задать своё: set ELECTRON_MIRROR=https://...');
  return false;
}

if (require.main === module) {
  process.exit(ensureElectronBinary() ? 0 : 1);
}

module.exports = { ensureElectronBinary, isElectronInstalled };
