import { reactive } from 'vue';

/**
 * Локальное состояние графа. Синхронизация с backend — через services/*.
 */
export const graphStore = reactive({
  objects: [],
  connections: [],
  regions: [],
  loading: false,
  error: null,
  view: {
    x: 80,
    y: 60,
    scale: 1,
  },
});

export function useGraphStore() {
  function setObjects(objects) {
    graphStore.objects = objects;
  }

  function addObject(object) {
    graphStore.objects.push(object);
  }

  function patchObject(id, patch) {
    const index = graphStore.objects.findIndex((item) => item.id === id);
    if (index === -1) return;
    graphStore.objects[index] = { ...graphStore.objects[index], ...patch };
  }

  function removeObject(id) {
    graphStore.objects = graphStore.objects.filter((item) => item.id !== id);
    graphStore.connections = graphStore.connections.filter(
      (item) => item.sourceId !== id && item.targetId !== id,
    );
  }

  function setConnections(connections) {
    graphStore.connections = connections;
  }

  function addConnection(connection) {
    graphStore.connections.push(connection);
  }

  function removeConnection(id) {
    graphStore.connections = graphStore.connections.filter((item) => item.id !== id);
  }

  function patchConnection(id, patch) {
    const index = graphStore.connections.findIndex((item) => item.id === id);
    if (index === -1) return;
    graphStore.connections[index] = { ...graphStore.connections[index], ...patch };
  }

  function setRegions(regions) {
    graphStore.regions = regions;
  }

  function addRegion(region) {
    graphStore.regions.push(region);
  }

  function removeRegion(id) {
    graphStore.regions = graphStore.regions.filter((item) => item.id !== id);
  }

  function patchRegion(id, patch) {
    const index = graphStore.regions.findIndex((item) => item.id === id);
    if (index === -1) return;
    graphStore.regions[index] = { ...graphStore.regions[index], ...patch };
  }

  function setLoading(value) {
    graphStore.loading = value;
  }

  function setError(error) {
    graphStore.error = error;
  }

  return {
    graphStore,
    setObjects,
    addObject,
    patchObject,
    removeObject,
    setConnections,
    addConnection,
    removeConnection,
    patchConnection,
    setRegions,
    addRegion,
    removeRegion,
    patchRegion,
    setLoading,
    setError,
  };
}
