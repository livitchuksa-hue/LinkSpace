/**
 * Обёртка над Preload API Electron.
 * В браузерном режиме Vite методы недоступны.
 */
export function useElectron() {
  const bridge = typeof window !== 'undefined' ? window.linkspace : null;
  const isElectron = Boolean(bridge);

  async function selectFile() {
    if (!bridge) return [];
    const result = await bridge.selectFile();
    return Array.isArray(result) ? result : result ? [result] : [];
  }

  async function selectFolder() {
    if (!bridge) return null;
    return bridge.selectFolder();
  }

  async function openPath(targetPath) {
    if (!bridge) return { ok: false, error: 'Electron API unavailable' };
    return bridge.openPath(targetPath);
  }

  async function openUrl(url) {
    if (!bridge) {
      window.open(url, '_blank', 'noopener');
      return { ok: true };
    }
    return bridge.openUrl(url);
  }

  async function statPath(targetPath) {
    if (!bridge) return { exists: false, path: targetPath };
    return bridge.statPath(targetPath);
  }

  async function readDataUrl(targetPath) {
    if (!bridge) return { ok: false, error: 'Electron API unavailable' };
    return bridge.readDataUrl(targetPath);
  }

  function getPathForFile(file) {
    if (!bridge?.getPathForFile) return null;
    return bridge.getPathForFile(file);
  }

  return {
    isElectron,
    selectFile,
    selectFolder,
    openPath,
    openUrl,
    statPath,
    readDataUrl,
    getPathForFile,
  };
}
