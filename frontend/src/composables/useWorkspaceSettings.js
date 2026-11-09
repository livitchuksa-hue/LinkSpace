import { watch } from 'vue';
import { settingsService } from '../services/settingsService';
import { graphStore } from '../stores/graphStore';
import { uiStore } from '../stores/uiStore';
import { normalizeFilter } from '../utils/filters';

const VIEW_KEY = 'graph.view';
const FIELDS_KEY = 'graph.fields';
const PANELS_KEY = 'ui.panels';
const REGION_KEY = 'graph.region';
const FILTER_KEY = 'graph.filter';
const SAVE_DELAY = 500;

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Загрузка и debounce-сохранение настроек графа в SQLite. */
export function useWorkspaceSettings() {
  let loaded = false;

  const saveView = debounce((view) => {
    if (!loaded) return;
    settingsService.set(VIEW_KEY, JSON.stringify(view)).catch(() => {});
  }, SAVE_DELAY);

  const saveFields = debounce((fields) => {
    if (!loaded) return;
    settingsService.set(FIELDS_KEY, JSON.stringify(fields)).catch(() => {});
  }, SAVE_DELAY);

  const savePanels = debounce((panels) => {
    if (!loaded) return;
    settingsService.set(PANELS_KEY, JSON.stringify(panels)).catch(() => {});
  }, SAVE_DELAY);

  const saveRegion = debounce((region) => {
    if (!loaded) return;
    settingsService.set(REGION_KEY, JSON.stringify(region)).catch(() => {});
  }, SAVE_DELAY);

  const saveFilter = debounce((filter) => {
    if (!loaded) return;
    settingsService.set(FILTER_KEY, JSON.stringify(filter)).catch(() => {});
  }, SAVE_DELAY);

  async function loadSettings({ retries = 20, retryDelay = 1200 } = {}) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const settings = await settingsService.getAll();
        const view = parseJson(settings[VIEW_KEY], null);
        if (view && typeof view === 'object') {
          graphStore.view = {
            x: Number(view.x) || 0,
            y: Number(view.y) || 0,
            scale: Number(view.scale) || 1,
          };
        }
        const fields = parseJson(settings[FIELDS_KEY], null);
        if (fields && typeof fields === 'object') {
          const migrated = { ...fields };
          if (typeof migrated.dates === 'boolean' && migrated.createdDate === undefined) {
            migrated.createdDate = migrated.dates;
            migrated.updatedDate = migrated.dates;
            migrated.openedDate = migrated.dates;
          }
          delete migrated.dates;
          uiStore.graphFields = { ...uiStore.graphFields, ...migrated };
        }
        const panels = parseJson(settings[PANELS_KEY], null);
        if (panels && typeof panels === 'object') {
          uiStore.leftPanelPinned = Boolean(panels.left);
          uiStore.rightPanelPinned = Boolean(panels.right);
        }
        const region = parseJson(settings[REGION_KEY], null);
        if (region && typeof region === 'object') {
          if (['polygon', 'rectangle', 'ellipse'].includes(region.shape)) {
            uiStore.regionDefaults.shape = region.shape;
          }
          if (typeof region.pointEditing === 'boolean') {
            uiStore.regionDefaults.pointEditing = region.pointEditing;
          }
        }
        const filter = parseJson(settings[FILTER_KEY], null);
        if (filter) {
          uiStore.filter = normalizeFilter(filter);
        }
        loaded = true;
        return;
      } catch {
        if (attempt >= retries) {
          loaded = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
  }

  function bindSettingsPersistence() {
    watch(() => ({ ...graphStore.view }), saveView, { deep: true });
    watch(() => ({ ...uiStore.graphFields }), saveFields, { deep: true });
    watch(
      () => ({ left: uiStore.leftPanelPinned, right: uiStore.rightPanelPinned }),
      savePanels,
      { deep: true },
    );
    watch(() => ({ ...uiStore.regionDefaults }), saveRegion, { deep: true });
    watch(() => ({ ...uiStore.filter, types: [...uiStore.filter.types], tags: [...uiStore.filter.tags] }), saveFilter, { deep: true });
  }

  return { loadSettings, bindSettingsPersistence };
}
