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
});

export function useGraphStore() {
  function setObjects(objects) {
    graphStore.objects = objects;
  }

  function addObject(object) {
    graphStore.objects.push(object);
  }

  function setConnections(connections) {
    graphStore.connections = connections;
  }

  function setRegions(regions) {
    graphStore.regions = regions;
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
    setConnections,
    setRegions,
    setLoading,
    setError,
  };
}
