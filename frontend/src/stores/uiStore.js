import { reactive } from 'vue';

/**
 * Состояние интерфейса: экран, инструмент, выбранный объект, поля на карточках.
 */
export const uiStore = reactive({
  currentView: 'graph',
  selectedObjectId: null,
  selectedConnectionId: null,
  selectedRegionId: null,
  tool: 'select',
  connectSourceId: null,
  statusMessage: '',
  welcomeVisible: true,
  settingsOpen: false,
  leftPanelPinned: false,
  rightPanelPinned: false,
  leftPanelOpen: false,
  rightPanelOpen: false,
  regionDefaults: {
    shape: 'polygon',
    pointEditing: true,
  },
  regionToolShape: 'polygon',
  pendingEdit: null,
  pendingDelete: null,
  graphFields: {
    title: true,
    type: true,
    disk: true,
    createdDate: true,
    updatedDate: true,
    openedDate: true,
    tags: true,
  },
});

export function useUiStore() {
  function setView(view) {
    uiStore.currentView = view;
    if (view !== 'graph') {
      clearSelection();
    }
  }

  function selectObject(id) {
    uiStore.selectedObjectId = id;
    uiStore.selectedConnectionId = null;
    uiStore.selectedRegionId = null;
    if (uiStore.tool !== 'connect') {
      uiStore.connectSourceId = null;
    }
  }

  function selectConnection(id) {
    uiStore.selectedConnectionId = id;
    uiStore.selectedObjectId = null;
    uiStore.selectedRegionId = null;
    uiStore.connectSourceId = null;
  }

  function selectRegion(id) {
    uiStore.selectedRegionId = id;
    uiStore.selectedObjectId = null;
    uiStore.selectedConnectionId = null;
    uiStore.connectSourceId = null;
  }

  function clearSelection() {
    uiStore.selectedObjectId = null;
    uiStore.selectedConnectionId = null;
    uiStore.selectedRegionId = null;
    uiStore.connectSourceId = null;
  }

  function setTool(tool) {
    uiStore.tool = tool;
    uiStore.connectSourceId = null;
  }

  function setStatus(message) {
    uiStore.statusMessage = message || '';
  }

  return {
    uiStore,
    setView,
    selectObject,
    selectConnection,
    selectRegion,
    clearSelection,
    setTool,
    setStatus,
  };
}
