import { objectService } from '../services/objectService';
import { connectionService } from '../services/connectionService';
import { regionService } from '../services/regionService';
import { graphStore, useGraphStore } from '../stores/graphStore';
import { uiStore } from '../stores/uiStore';
import { useElectron } from './useElectron';
import { parseTags, serializeTags } from '../utils/tags';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeObject(object) {
  return object ? { ...object, tags: parseTags(object.tags) } : object;
}

function layerValue(item) {
  return Number(item?.zIndex) || 0;
}

export function sortByLayer(list) {
  return [...list].sort((a, b) => layerValue(a) - layerValue(b) || Number(a.id) - Number(b.id));
}

function topLayerIndex(list) {
  return list.reduce((max, item) => Math.max(max, layerValue(item)), -1) + 1;
}

/**
 * Загрузка и изменение данных графа через REST API.
 */
export function useGraph() {
  const store = useGraphStore();
  const { isElectron, statPath } = useElectron();

  async function loadGraph({ retries = 20, retryDelay = 1200 } = {}) {
    store.setLoading(true);
    store.setError(null);

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const [objects, connections, regions] = await Promise.all([
          objectService.getAll(),
          connectionService.getAll(),
          regionService.getAll(),
        ]);

        store.setObjects(objects.map(normalizeObject));
        store.setConnections(connections);
        store.setRegions(regions);
        await refreshFileStatus();
        store.setLoading(false);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await wait(retryDelay);
        }
      }
    }

    store.setError(lastError?.message || 'Не удалось загрузить граф');
    store.setLoading(false);
  }

  async function refreshFileStatus() {
    if (!isElectron) return;

    await Promise.all(graphStore.objects.map(async (object) => {
      if (object.type !== 'FILE' && object.type !== 'FOLDER') {
        store.patchObject(object.id, { missing: false });
        return;
      }
      if (!object.path) {
        store.patchObject(object.id, { missing: true });
        return;
      }
      const stat = await statPath(object.path);
      store.patchObject(object.id, {
        missing: !stat.exists,
        exists: Boolean(stat.exists),
        disk: stat.disk || object.disk || null,
      });
    }));
  }

  function toPayload(object) {
    return {
      title: object.title,
      type: object.type,
      description: object.description || null,
      content: object.content || null,
      path: object.path || null,
      url: object.url || null,
      disk: object.disk || null,
      fileSize: object.fileSize ?? null,
      fileCreatedAt: object.fileCreatedAt || null,
      fileModifiedAt: object.fileModifiedAt || null,
      x: object.x ?? 0,
      y: object.y ?? 0,
      color: object.color || null,
      width: object.width ?? null,
      height: object.height ?? null,
      tags: serializeTags(object.tags),
      zIndex: object.zIndex ?? null,
    };
  }

  async function createObject(payload) {
    const enriched = { ...payload, zIndex: payload.zIndex ?? topLayerIndex(graphStore.objects) };
    const created = await objectService.create(toPayload(enriched));
    store.addObject(normalizeObject(created));
    uiStore.selectObject(created.id);
    await refreshFileStatus();
    return created;
  }

  async function updateObject(id, payload) {
    const updated = await objectService.update(id, toPayload({ ...payload, id }));
    store.patchObject(id, normalizeObject(updated));
    return updated;
  }

  async function moveObject(id, x, y) {
    store.patchObject(id, { x, y });
    try {
      await objectService.updatePosition(id, { x, y });
    } catch (error) {
      uiStore.setStatus(`Позиция не сохранена: ${error.message}`);
    }
  }

  async function resizeObject(id, width, height) {
    const node = graphStore.objects.find((item) => item.id === id);
    store.patchObject(id, { width, height });
    try {
      await objectService.update(id, toPayload({ ...(node || {}), id, width, height }));
    } catch (error) {
      uiStore.setStatus(`Размер не сохранён: ${error.message}`);
    }
  }

  async function markOpened(id) {
    const updated = await objectService.markOpened(id);
    store.patchObject(id, normalizeObject(updated));
    return updated;
  }

  async function deleteObject(id) {
    await objectService.remove(id);
    store.removeObject(id);
    if (uiStore.selectedObjectId === id) {
      uiStore.clearSelection();
    }
  }

  async function createConnection(sourceId, targetId, label = null) {
    const created = await connectionService.create({
      sourceId,
      targetId,
      label,
      zIndex: topLayerIndex(graphStore.connections),
    });
    store.addConnection(created);
    return created;
  }

  async function updateConnection(id, payload) {
    const updated = await connectionService.update(id, payload);
    store.patchConnection(id, updated);
    return updated;
  }

  async function deleteConnection(id) {
    await connectionService.remove(id);
    store.removeConnection(id);
    if (uiStore.selectedConnectionId === id) {
      uiStore.clearSelection();
    }
  }

  async function createRegion(region) {
    const created = await regionService.create({
      ...region,
      zIndex: region.zIndex ?? topLayerIndex(graphStore.regions),
    });
    store.addRegion(created);
    return created;
  }

  async function updateRegion(id, payload) {
    const updated = await regionService.update(id, payload);
    store.patchRegion(id, updated);
    return updated;
  }

  /**
   * Изменение z-порядка внутри одной коллекции (objects/connections/regions).
   * Нормализует zIndex в 0..n-1 и сохраняет все затронутые элементы.
   */
  async function reorderLayer(kind, id, mode) {
    try {
      const items = sortByLayer(
        kind === 'object' ? graphStore.objects
          : kind === 'connection' ? graphStore.connections
            : kind === 'region' ? graphStore.regions
              : [],
      );
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return;

      let target = index;
      if (mode === 'forward') target = Math.min(index + 1, items.length - 1);
      else if (mode === 'backward') target = Math.max(index - 1, 0);
      else if (mode === 'front') target = items.length - 1;
      else if (mode === 'back') target = 0;
      else return;
      if (target === index) return;

      const [moved] = items.splice(index, 1);
      items.splice(target, 0, moved);

      const persist = items.map((item, position) => {
        const zIndex = position;
        if (kind === 'object') {
          return objectService.update(item.id, toPayload({ ...item, zIndex }));
        }
        if (kind === 'connection') {
          return connectionService.update(item.id, {
            sourceId: item.sourceId,
            targetId: item.targetId,
            label: item.label || null,
            color: item.color || null,
            zIndex,
          });
        }
        return regionService.update(item.id, {
          name: item.name,
          color: item.color || null,
          shape: item.shape || 'polygon',
          coordinates: item.coordinates,
          zIndex,
        });
      });

      items.forEach((item, position) => {
        if (kind === 'object') store.patchObject(item.id, { zIndex: position });
        else if (kind === 'connection') store.patchConnection(item.id, { zIndex: position });
        else store.patchRegion(item.id, { zIndex: position });
      });

      await Promise.all(persist);
      uiStore.setStatus('Порядок слоёв обновлён');
    } catch (error) {
      uiStore.setStatus(error?.message || 'Не удалось изменить порядок слоёв');
      try {
        await loadGraph();
      } catch {
        // ignore reload errors
      }
    }
  }

  async function deleteRegion(id) {
    await regionService.remove(id);
    store.removeRegion(id);
    if (uiStore.selectedRegionId === id) {
      uiStore.clearSelection();
    }
  }

  return {
    loadGraph,
    refreshFileStatus,
    createObject,
    updateObject,
    moveObject,
    resizeObject,
    markOpened,
    deleteObject,
    createConnection,
    updateConnection,
    deleteConnection,
    createRegion,
    updateRegion,
    deleteRegion,
    reorderLayer,
    sortByLayer,
    graphStore,
  };
}
