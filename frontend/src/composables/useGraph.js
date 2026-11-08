import { objectService } from '../services/objectService';
import { connectionService } from '../services/connectionService';
import { regionService } from '../services/regionService';
import { useGraphStore } from '../stores/graphStore';

/**
 * Загрузка и базовая работа с данными графа через REST API.
 */
export function useGraph() {
  const store = useGraphStore();

  async function loadGraph() {
    store.setLoading(true);
    store.setError(null);

    try {
      const [objects, connections, regions] = await Promise.all([
        objectService.getAll(),
        connectionService.getAll(),
        regionService.getAll(),
      ]);

      store.setObjects(objects);
      store.setConnections(connections);
      store.setRegions(regions);
    } catch (error) {
      store.setError(error.message || 'Не удалось загрузить граф');
    } finally {
      store.setLoading(false);
    }
  }

  return {
    loadGraph,
    graphStore: store.graphStore,
  };
}
