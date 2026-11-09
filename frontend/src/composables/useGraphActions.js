import { ref } from 'vue';
import { graphStore } from '../stores/graphStore';
import { uiStore, useUiStore } from '../stores/uiStore';
import { useGraph } from './useGraph';
import { useElectron } from './useElectron';
import { fileNameFromPath } from '../utils/formatters';

/**
 * Общие действия графа: создание объектов, инструменты, drag-and-drop.
 * Состояние — модульный синглтон, чтобы кнопки в Sidebar и GraphView
 * работали с одними и теми же модальными окнами и canvasRef.
 */
export const canvasRef = ref(null);
export const createOpen = ref(false);
export const createType = ref('NOTE');
export const regionDraft = ref(null);

const { setTool } = useUiStore();

export function useGraphActions() {
  const {
    createObject,
    createRegion,
    refreshFileStatus,
  } = useGraph();
  const {
    isElectron,
    selectFile,
    selectFolder,
    statPath,
    getPathForFile,
  } = useElectron();

  function nextPosition() {
    const count = graphStore.objects.length;
    const column = count % 5;
    const row = Math.floor(count / 5);
    return {
      x: 160 + column * 250 + (count % 3) * 18,
      y: 120 + row * 150 + (count % 4) * 14,
    };
  }

  function openCreate(type = 'NOTE') {
    createType.value = type;
    createOpen.value = true;
  }

  function toggleTool(tool) {
    const next = uiStore.tool === tool ? 'select' : tool;
    if (next === 'region' && uiStore.tool !== 'region') {
      uiStore.regionToolShape = uiStore.regionDefaults.shape || 'polygon';
    }
    setTool(next);
  }

  function setRegionToolShape(shape) {
    if (['polygon', 'rectangle', 'ellipse'].includes(shape)) {
      uiStore.regionToolShape = shape;
    }
  }

  function finishRegion() {
    canvasRef.value?.finishRegion?.();
  }

  function completeRegion(points, shape = 'polygon') {
    setTool('select');
    regionDraft.value = {
      name: `Область ${graphStore.regions.length + 1}`,
      color: '#3b82f6',
      shape: ['polygon', 'rectangle', 'ellipse'].includes(shape) ? shape : 'polygon',
      coordinates: JSON.stringify(points),
    };
  }

  async function handleCreate(payload) {
    try {
      const position = nextPosition();
      await createObject({ ...payload, x: position.x, y: position.y });
      createOpen.value = false;
      uiStore.welcomeVisible = false;
      uiStore.setStatus('');
    } catch (error) {
      uiStore.setStatus(error.message || 'Не удалось создать объект');
    }
  }

  async function handleRegionSave(payload) {
    try {
      const created = await createRegion({
        name: payload.name,
        color: payload.color,
        shape: payload.shape || 'polygon',
        coordinates: payload.coordinates,
      });
      const { selectRegion } = useUiStore();
      selectRegion(created.id);
      regionDraft.value = null;
      uiStore.setStatus('Область создана');
    } catch (error) {
      uiStore.setStatus(error.message || 'Не удалось создать область');
    }
  }

  async function addLocalMaterial(type) {
    if (!isElectron) {
      openCreate(type);
      return;
    }

    const paths = type === 'FOLDER' ? [await selectFolder()].filter(Boolean) : await selectFile();
    if (!paths.length) return;
    await addPaths(paths);
  }

  async function addPaths(paths, startPoint = null) {
    let index = 0;
    for (const targetPath of paths) {
      try {
        const stat = await statPath(targetPath);
        const type = stat.isDirectory ? 'FOLDER' : 'FILE';
        const position = startPoint
          ? {
              x: startPoint.x - 98 + (index % 4) * 36,
              y: startPoint.y - 56 + Math.floor(index / 4) * 36,
            }
          : nextPosition();
        await createObject({
          title: fileNameFromPath(targetPath) || 'Материал',
          type,
          description: '',
          content: null,
          path: targetPath,
          url: null,
          disk: stat.disk || null,
          fileSize: type === 'FOLDER' ? null : (stat.fileSize ?? null),
          fileCreatedAt: stat.fileCreatedAt || null,
          fileModifiedAt: stat.fileModifiedAt || null,
          x: position.x,
          y: position.y,
        });
        index += 1;
      } catch (error) {
        uiStore.setStatus(error.message || `Не удалось добавить ${targetPath}`);
      }
    }
    uiStore.welcomeVisible = false;
    await refreshFileStatus();
  }

  async function handleDropFiles({ files, point }) {
    if (!files?.length) return;
    const paths = [];
    for (const file of files) {
      const path = getPathForFile?.(file);
      if (path) paths.push(path);
    }
    if (!paths.length) {
      uiStore.setStatus('Не удалось получить путь к перетащенным файлам. Используйте кнопки «Файл» или «Папка».');
      return;
    }
    await addPaths(paths, point);
  }

  return {
    canvasRef,
    createOpen,
    createType,
    regionDraft,
    nextPosition,
    openCreate,
    toggleTool,
    setRegionToolShape,
    finishRegion,
    completeRegion,
    handleCreate,
    handleRegionSave,
    addLocalMaterial,
    addPaths,
    handleDropFiles,
  };
}
