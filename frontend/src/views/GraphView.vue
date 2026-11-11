<template>
  <section class="graph-view">
    <div class="graph-view__top">
      <div
        v-if="uiStore.tool === 'region'"
        class="region-bar-wrap"
        :style="{ paddingLeft: uiStore.leftPanelOpen ? 'var(--ls-sidebar-width)' : '0px' }"
      >
        <div class="region-bar" :class="{ 'liquid-glass': uiStore.liquidGlass }">
        <BaseButton variant="primary" @click="finishRegion">Завершить</BaseButton>
        <BaseButton variant="ghost" @click="toggleTool('region')">Отмена</BaseButton>
        <span class="region-bar__divider" aria-hidden="true"></span>
        <div class="region-bar__seg">
          <button
            v-for="option in regionShapeOptions"
            :key="option.value"
            class="region-bar__shape"
            :class="{ 'region-bar__shape--active': uiStore.regionToolShape === option.value }"
            type="button"
            @click="setRegionToolShape(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <span class="region-bar__hint">{{ regionHint }}</span>
        </div>
      </div>
      <p v-if="uiStore.statusMessage" class="graph-view__status">{{ uiStore.statusMessage }}</p>
      <p v-if="graphStore.loading" class="graph-view__status">Загрузка графа…</p>
      <p v-else-if="graphStore.error" class="graph-view__status graph-view__status--error">{{ graphStore.error }}</p>
    </div>

    <div
      v-if="uiStore.tool !== 'region'"
      class="filter-zone"
    >
      <div class="filter-zone__hot" aria-hidden="true"></div>
      <div class="filter-zone__body">
      <div class="filter-bar" :class="{ 'liquid-glass': uiStore.liquidGlass }">
        <div class="filter-bar__group">
          <span class="filter-bar__caption">Тип</span>
          <div class="filter-bar__chips">
            <button
              v-for="type in OBJECT_TYPES"
              :key="type"
              class="filter-chip"
              :class="{ 'filter-chip--off': uiStore.filter.types.length > 0 && !uiStore.filter.types.includes(type) }"
              type="button"
              @click="toggleFilterType(type)"
            >
              {{ typeLabel(type) }}
            </button>
          </div>
        </div>

        <div v-if="allDisks.length" class="filter-bar__group">
          <span class="filter-bar__caption">Диск</span>
          <div class="filter-bar__chips">
            <button
              v-for="disk in allDisks"
              :key="disk"
              class="filter-chip"
              :class="{ 'filter-chip--on': uiStore.filter.disks.length === 0 || uiStore.filter.disks.includes(disk) }"
              type="button"
              @click="toggleFilterDisk(disk)"
            >
              {{ disk }}
            </button>
          </div>
        </div>

        <div v-if="allTags.length" class="filter-bar__group">
          <span class="filter-bar__caption">Теги</span>
          <div class="filter-dropdown">
            <button
              class="filter-chip"
              :class="{ 'filter-chip--on': uiStore.filter.tags.length > 0 }"
              type="button"
              @click="tagsOpen = !tagsOpen"
            >
              {{ uiStore.filter.tags.length ? `Теги: ${uiStore.filter.tags.length}` : 'Все теги' }}
            </button>
            <template v-if="tagsOpen">
              <div class="filter-dropdown__backdrop" @click="tagsOpen = false"></div>
              <div
                class="filter-dropdown__list"
                :class="{ 'liquid-glass': uiStore.liquidGlass }"
              >
                <label
                  v-for="tag in allTags"
                  :key="tag.name"
                  class="filter-dropdown__item"
                >
                  <input
                    type="checkbox"
                    :checked="uiStore.filter.tags.includes(tagKey(tag.name))"
                    @change="toggleFilterTag(tag.name)"
                  />
                  <span class="filter-dropdown__dot" :style="{ background: tag.color }"></span>
                  <span class="filter-dropdown__name">{{ tag.name }}</span>
                </label>
              </div>
            </template>
          </div>
        </div>

        <div class="filter-bar__group">
          <span class="filter-bar__caption">Дата</span>
          <select v-model="uiStore.filter.dateField" class="filter-bar__select">
            <option v-for="field in DATE_FIELDS" :key="field.value" :value="field.value">
              {{ field.label }}
            </option>
          </select>
          <input v-model="uiStore.filter.dateFrom" class="filter-bar__date" type="date" title="С даты" />
          <span class="filter-bar__sep">—</span>
          <input v-model="uiStore.filter.dateTo" class="filter-bar__date" type="date" title="По дату" />
        </div>

      </div>
      <button
        v-if="criteriaCount"
        class="filter-chip filter-chip--reset"
        type="button"
        @click="resetFilter"
      >
        Сбросить · найдено {{ matchedCount }} из {{ graphStore.objects.length }}
      </button>
      </div>
    </div>

    <GraphCanvas
      ref="canvasRef"
      :objects="graphStore.objects"
      :connections="graphStore.connections"
      :regions="graphStore.regions"
      :selected-id="uiStore.selectedObjectId"
      :selected-object-ids="uiStore.selectedObjectIds"
      :selected-connection-id="uiStore.selectedConnectionId"
      :selected-region-id="uiStore.selectedRegionId"
      :connect-source-id="uiStore.connectSourceId"
      :tool="uiStore.tool"
      @select-canvas="clearSelection"
      @select-node="handleSelectNode"
      @open-node="handleOpenNode"
      @select-edge="(edge) => selectConnection(edge.id)"
      @select-region="(region) => selectRegion(region.id)"
      @move-end="handleMoveEnd"
      @resize-end="handleResizeEnd"
      @region-complete="completeRegion"
      @region-move-end="handleRegionMoveEnd"
      @drop-files="handleDropFiles"
      @context-action="handleContextAction"
      @select-nodes="handleSelectNodes"
    >
      <div v-if="uiStore.welcomeVisible" class="welcome">
        <p class="welcome__eyebrow">Добро пожаловать</p>
        <h2 class="welcome__title">Linkspace</h2>
        <p class="welcome__text">
          Здесь будет ваш граф заметок, файлов, папок и ссылок.
        </p>
        <p class="welcome__hint">
          Чтобы создать или прикрепить объект, наведите курсор на левую часть экрана —
          там появится панель с инструментами.
        </p>
      </div>
    </GraphCanvas>

    <div
      class="zoom-hud"
      :class="{ 'liquid-glass': uiStore.liquidGlass }"
      title="Масштаб графа"
    >
      {{ zoomLabel }}
    </div>

    <BaseModal
      v-model="createOpen"
      :title="createType === 'LINK' ? 'Новая ссылка' : 'Новый объект'"
    >
      <ObjectEditor
        v-if="createOpen"
        :default-type="createType"
        @save="handleCreate"
        @cancel="createOpen = false"
      />
    </BaseModal>

    <BaseModal
      :model-value="Boolean(regionDraft)"
      title="Новая область"
      @update:model-value="(value) => { if (!value) regionDraft = null; }"
    >
      <RegionEditor
        v-if="regionDraft"
        :region="regionDraft"
        @save="handleRegionSave"
        @cancel="regionDraft = null"
      />
    </BaseModal>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import GraphCanvas from '../components/graph/GraphCanvas.vue';
import BaseButton from '../components/common/BaseButton.vue';
import BaseModal from '../components/common/BaseModal.vue';
import ObjectEditor from '../components/objects/ObjectEditor.vue';
import RegionEditor from '../components/objects/RegionEditor.vue';
import { graphStore } from '../stores/graphStore';
import { uiStore, useUiStore } from '../stores/uiStore';
import {
  activeCriteriaCount,
  DATE_FIELDS,
  OBJECT_TYPES,
  objectMatchesFilter,
} from '../utils/filters';
import { tagKey, tagRegistry } from '../utils/tags';
import { typeLabel } from '../utils/formatters';
import { useGraph } from '../composables/useGraph';
import { useElectron } from '../composables/useElectron';
import { useGraphActions, canvasRef, createOpen, createType, regionDraft } from '../composables/useGraphActions';

const {
  toggleTool,
  finishRegion,
  setRegionToolShape,
  completeRegion,
  handleCreate,
  handleRegionSave,
  handleDropFiles,
  createAt,
} = useGraphActions();

const { loadGraph, moveObject, resizeObject, createConnection, updateRegion, markOpened, reorderLayer } = useGraph();
const { openPath, openUrl } = useElectron();
const { selectObject, selectConnection, selectRegion, clearSelection, setTool, toggleMultiSelect } = useUiStore();

const regionShapeOptions = [
  { value: 'polygon', label: 'Контур' },
  { value: 'rectangle', label: 'Прямоугольник' },
  { value: 'ellipse', label: 'Эллипс' },
];

const tagsOpen = ref(false);
const allTags = computed(() => tagRegistry(graphStore.objects));
const allDisks = computed(() => [
  ...new Set(graphStore.objects.map((item) => item.disk).filter(Boolean)),
].sort());
const criteriaCount = computed(() => activeCriteriaCount(uiStore.filter));
const matchedCount = computed(() =>
  graphStore.objects.filter((item) => objectMatchesFilter(item, uiStore.filter)).length,
);
const zoomLabel = computed(() => `${Math.round((graphStore.view.scale || 1) * 100)}%`);

function toggleFilterType(type) {
  const current = uiStore.filter.types;
  uiStore.filter.types = current.includes(type)
    ? current.filter((item) => item !== type)
    : [...current, type];
}

function toggleFilterTag(name) {
  const key = tagKey(name);
  uiStore.filter.tags = uiStore.filter.tags.includes(key)
    ? uiStore.filter.tags.filter((item) => item !== key)
    : [...uiStore.filter.tags, key];
}

function toggleFilterDisk(disk) {
  uiStore.filter.disks = uiStore.filter.disks.includes(disk)
    ? uiStore.filter.disks.filter((item) => item !== disk)
    : [...uiStore.filter.disks, disk];
}

function resetFilter() {
  uiStore.filter.types = [];
  uiStore.filter.tags = [];
  uiStore.filter.disks = [];
  uiStore.filter.dateFrom = '';
  uiStore.filter.dateTo = '';
}

const regionHint = computed(() => {
  const keys = ' · Enter — завершить, Esc — отмена';
  if (uiStore.regionToolShape === 'polygon') {
    return `Кликайте точки контура; клик по первой точке, двойной клик или «Завершить» замыкает его${keys}`;
  }
  return `Кликните первый угол, затем противоположный — область построится по ним${keys}`;
});

function handleSelectNode(node, event) {
  if (uiStore.tool === 'connect') {
    if (!uiStore.connectSourceId) {
      uiStore.connectSourceId = node.id;
      selectObject(node.id);
      return;
    }
    if (uiStore.connectSourceId === node.id) {
      uiStore.setStatus('Выберите другой узел для связи');
      return;
    }
    const sourceId = uiStore.connectSourceId;
    createConnection(sourceId, node.id)
      .then(() => {
        uiStore.connectSourceId = null;
        setTool('select');
        uiStore.setStatus('Связь создана');
      })
      .catch((error) => uiStore.setStatus(error.message || 'Не удалось создать связь'));
    return;
  }

  const multi = event?.ctrlKey || event?.metaKey;
  const inSelection = uiStore.selectedObjectIds.length > 1
    && uiStore.selectedObjectIds.includes(node.id);

  if (multi) {
    // Тоггл по pointerdown: click может не дойти из-за pointer capture на канвасе
    if (event?.type !== 'click') {
      toggleMultiSelect(node.id);
    }
    uiStore.selectedObjectId = node.id;
    uiStore.selectedConnectionId = null;
    uiStore.selectedRegionId = null;
    return;
  }

  // Нажатие на узел из мультивыделения не должно сбрасывать группу
  if (inSelection) {
    uiStore.selectedObjectId = node.id;
    uiStore.selectedConnectionId = null;
    uiStore.selectedRegionId = null;
    return;
  }

  selectObject(node.id);
}

function handleSelectNodes(ids) {
  uiStore.selectedObjectIds = ids;
  uiStore.selectedObjectId = ids.length ? ids[ids.length - 1] : null;
  uiStore.selectedConnectionId = null;
  uiStore.selectedRegionId = null;
}

async function handleOpenNode(node) {
  if (uiStore.tool === 'connect' || uiStore.tool === 'region') return;
  selectObject(node.id);

  try {
    if (node.type === 'FILE' || node.type === 'FOLDER') {
      await markOpened(node.id);
      const result = await openPath(node.path);
      if (!result.ok) uiStore.setStatus(result.error || 'Не удалось открыть путь');
    } else if (node.type === 'LINK') {
      await markOpened(node.id);
      await openUrl(node.url);
    }
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось открыть объект');
  }
}

function handleContextAction({ action, kind, id, createType: wantedType, point }) {
  if (action === 'create' && kind === 'canvas') {
    createAt(wantedType || 'NOTE', point);
    return;
  }

  if (action === 'open' && kind === 'object') {
    const node = graphStore.objects.find((item) => item.id === id);
    if (node) handleOpenNode(node);
    return;
  }

  if (action === 'connect' && kind === 'object') {
    setTool('connect');
    uiStore.connectSourceId = id;
    selectObject(id);
    uiStore.setStatus('Выберите второй узел для связи');
    return;
  }

  if (action === 'edit') {
    if (kind === 'object') {
      selectObject(id);
      uiStore.pendingEdit = { kind: 'object', id };
    } else if (kind === 'connection') {
      selectConnection(id);
    } else if (kind === 'region') {
      selectRegion(id);
      uiStore.pendingEdit = { kind: 'region', id };
    }
    return;
  }

  reorderLayer(kind, id, action);
}

function handleMoveEnd({ id, x, y }) {
  moveObject(id, x, y);
}

function handleResizeEnd({ id, width, height }) {
  resizeObject(id, width, height);
}

async function handleRegionMoveEnd({ id, coordinates }) {
  const region = graphStore.regions.find((item) => item.id === id);
  if (!region) return;
  try {
    await updateRegion(id, {
      name: region.name,
      color: region.color,
      shape: region.shape || 'polygon',
      coordinates,
    });
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось сохранить область');
  }
}

onMounted(async () => {
  await loadGraph();
  if (graphStore.objects.length > 0) {
    uiStore.welcomeVisible = false;
  }
});
</script>

<style scoped>
.graph-view {
  position: relative;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.graph-view__top {
  padding: var(--ls-space-4) var(--ls-space-5) 0;
  min-height: 0;
  user-select: none;
  -webkit-user-select: none;
}

.graph-view__status {
  margin: var(--ls-space-2) 0 0;
  color: var(--ls-text-muted);
  font-size: 0.8rem;
}

.graph-view__status--error {
  color: #e4e4e4;
}

.region-bar-wrap {
  display: flex;
  justify-content: center;
}

.region-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  padding: 6px 10px;
  background: var(--ls-bg-panel);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-md);
  box-shadow: var(--ls-shadow-md);
}

.region-bar__divider {
  width: 1px;
  height: 20px;
  background: var(--ls-border-subtle);
}

.region-bar__seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--ls-bg-soft);
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
}

.region-bar__shape {
  border: none;
  background: transparent;
  color: var(--ls-text-muted);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: color var(--ls-transition), background var(--ls-transition);
}

.region-bar__shape:hover {
  color: var(--ls-text);
}

.region-bar__shape--active {
  color: var(--ls-text);
  background: var(--ls-bg-elevated);
  box-shadow: var(--ls-shadow-sm);
}

.region-bar__hint {
  color: var(--ls-text-faint);
  font-size: 0.74rem;
  padding: 0 4px;
  max-width: 340px;
}

.filter-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
}

.filter-zone input,
.filter-zone select {
  user-select: text;
  -webkit-user-select: text;
}

.filter-chip--reset {
  margin-top: 6px;
  align-self: center;
}

.filter-zone__hot {
  width: 100%;
  height: 10px;
}

.filter-zone__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-130%);
  opacity: 0;
  transition: transform 0.18s ease, opacity 0.18s ease;
  pointer-events: none;
}

.filter-zone:hover .filter-zone__body,
.filter-zone:focus-within .filter-zone__body {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 16px;
  max-width: calc(100% - 32px);
  padding: 8px 14px;
  border-radius: var(--ls-radius-lg);
}

.filter-bar__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-bar__caption {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ls-text-dim);
}

.filter-bar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.filter-chip {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg-elevated);
  color: var(--ls-text-muted);
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: var(--ls-text-dim);
}

.filter-chip--off {
  opacity: 0.4;
}

.filter-chip--on {
  border-color: transparent;
}

.filter-chip--reset {
  border-style: dashed;
}

.filter-bar__select,
.filter-bar__date {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg-elevated);
  color: var(--ls-text);
  border-radius: var(--ls-radius-sm);
  padding: 4px 7px;
  font-size: 0.75rem;
}

.filter-bar__date {
  color-scheme: dark;
}

.filter-bar__sep {
  color: var(--ls-text-dim);
  font-size: 0.75rem;
}

.filter-dropdown {
  position: relative;
}

.filter-dropdown__backdrop {
  position: fixed;
  inset: 0;
  z-index: 41;
}

.filter-dropdown__list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 42;
  min-width: 180px;
  max-height: 260px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 4px;
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-md);
  box-shadow: var(--ls-shadow-md);
}

.filter-dropdown__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--ls-text);
  cursor: pointer;
  white-space: nowrap;
}

.filter-dropdown__item:hover {
  background: var(--ls-bg-soft);
}

.filter-dropdown__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: 0 0 9px;
}

.filter-dropdown__name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.zoom-hud {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 30;
  padding: 4px 12px;
  border: 1px solid var(--ls-border);
  border-radius: 999px;
  background: var(--ls-bg-elevated);
  color: var(--ls-text-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  user-select: none;
}

.welcome {
  width: min(400px, calc(100% - 48px));
  text-align: center;
  padding: var(--ls-space-6) var(--ls-space-5);
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-lg);
  background: var(--ls-bg-elevated);
}

.welcome__eyebrow {
  margin: 0 0 var(--ls-space-2);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ls-text-faint);
}

.welcome__title {
  margin: 0 0 var(--ls-space-3);
  font-family: var(--ls-font-display);
  font-size: 1.6rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.welcome__text {
  margin: 0 0 var(--ls-space-3);
  color: var(--ls-text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.welcome__hint {
  margin: 0;
  padding-top: var(--ls-space-3);
  border-top: 1px solid var(--ls-border-subtle);
  color: var(--ls-text-dim);
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
