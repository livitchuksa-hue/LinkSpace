/**
 * Запуск Electron с очищенным ELECTRON_RUN_AS_NODE.
 * --dev включает Vite Dev Server через ELECTRON_DEV=1.
 */
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

const dev = process.argv.includes('--dev');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
if (dev) {
  env.ELECTRON_DEV = '1';
}

const child = spawn(electron, ['.'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
