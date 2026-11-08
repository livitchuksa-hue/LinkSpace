/**
 * Обёртка над Preload API Electron.
 * В браузерном режиме Vite методы недоступны и возвращают null.
 */
export function useElectron() {
  const bridge = typeof window !== 'undefined' ? window.linkspace : null;

  const isElectron = Boolean(bridge);

  async function selectFile() {
    if (!bridge) return null;
    return bridge.selectFile();
  }

  async function selectFolder() {
    if (!bridge) return null;
    return bridge.selectFolder();
  }

  async function openPath(targetPath) {
    if (!bridge) return { ok: false, error: 'Electron API unavailable' };
    return bridge.openPath(targetPath);
  }

  return {
    isElectron,
    selectFile,
    selectFolder,
    openPath,
  };
}
