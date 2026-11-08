/**
 * Заготовка взаимодействий с холстом графа
 * (перетаскивание узлов, создание связей, выделение областей).
 * Полная реализация появится на следующем этапе.
 */
export function useGraphInteraction() {
  function onNodeDragStart(_nodeId, _event) {
    // reserved
  }

  function onCanvasClick(_event) {
    // reserved
  }

  return {
    onNodeDragStart,
    onCanvasClick,
  };
}
