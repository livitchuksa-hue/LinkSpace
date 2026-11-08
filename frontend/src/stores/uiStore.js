import { reactive } from 'vue';

/**
 * Состояние интерфейса: текущий экран, панели, выбранный объект.
 */
export const uiStore = reactive({
  currentView: 'graph',
  sidebarCollapsed: false,
  selectedObjectId: null,
  welcomeVisible: true,
});

export function useUiStore() {
  function setView(view) {
    uiStore.currentView = view;
  }

  function selectObject(id) {
    uiStore.selectedObjectId = id;
  }

  function hideWelcome() {
    uiStore.welcomeVisible = false;
  }

  return {
    uiStore,
    setView,
    selectObject,
    hideWelcome,
  };
}
