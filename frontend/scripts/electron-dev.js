/**
 * Запуск Electron в режиме разработки (Vite Dev Server).
 */
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

const child = spawn(electron, ['.'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_DEV: '1',
  },
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
