<template>
  <section class="graph-view">
    <div class="graph-view__top">
      <div
        v-if="uiStore.tool === 'region'"
        class="region-bar-wrap"
        :style="{ paddingLeft: uiStore.leftPanelOpen ? 'var(--ls-sidebar-width)' : '0px' }"
      >
        <div class="region-bar">
        <BaseButton variant="primary" @click="finishRegion">Завершить</BaseButton>
        <BaseButton variant="ghost" @click="toggleTool('region')">Отмена</BaseButton>
        <span class="region-bar__divider" aria-hidden="true"></span>
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
      <div class="filter-bar">
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
          <div class="filter-bar__chips">
            <button
              v-for="tag in allTags"
              :key="tag.name"
              class="filter-chip"
              :class="{ 'filter-chip--on': uiStore.filter.tags.includes(tagKey(tag.name)) }"
              :style="uiStore.filter.tags.includes(tagKey(tag.name)) ? { background: tag.color, color: readableOn(tag.color) } : {}"
              type="button"
              @click="toggleFilterTag(tag.name)"
            >
              {{ tag.name }}
            </button>
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
        Сбросить · {{ matchedCount }}/{{ graphStore.objects.length }}
      </button>
      </div>
    </div>

    <GraphCanvas
      ref="canvasRef"
      :objects="graphStore.objects"
      :connections="graphStore.connections"
      :regions="graphStore.regions"
      :selected-id="uiStore.selectedObjectId"
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
import { computed, onMounted } from 'vue';
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
import { readableOn } from '../utils/nodeAppearance';
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
} = useGraphActions();

const { loadGraph, moveObject, resizeObject, createConnection, updateRegion, markOpened, reorderLayer } = useGraph();
const { openPath, openUrl } = useElectron();
const { selectObject, selectConnection, selectRegion, clearSelection, setTool } = useUiStore();

const regionShapeOptions = [
  { value: 'polygon', label: 'Контур' },
  { value: 'rectangle', label: 'Прямоугольник' },
  { value: 'ellipse', label: 'Эллипс' },
];

const allTags = computed(() => tagRegistry(graphStore.objects));
const allDisks = computed(() => [
  ...new Set(graphStore.objects.map((item) => item.disk).filter(Boolean)),
].sort());
const criteriaCount = computed(() => activeCriteriaCount(uiStore.filter));
const matchedCount = computed(() =>
  graphStore.objects.filter((item) => objectMatchesFilter(item, uiStore.filter)).length,
);

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

function handleSelectNode(node) {
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
        uiStore.setStatus('Связь создана');
      })
      .catch((error) => uiStore.setStatus(error.message || 'Не удалось создать связь'));
    return;
  }

  selectObject(node.id);
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

function handleContextAction({ action, kind, id }) {
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
}

.region-bar__divider {
  width: 1px;
  height: 24px;
  background: var(--ls-border);
}

.region-bar__shape {
  border: 1px solid var(--ls-border);
  background: transparent;
  color: var(--ls-text-muted);
  padding: 6px 12px;
  border-radius: var(--ls-radius-sm);
  font-size: 0.82rem;
  cursor: pointer;
}

.region-bar__shape--active {
  color: var(--ls-text);
  border-color: var(--ls-text-dim);
  background: var(--ls-bg-soft);
}

.region-bar__hint {
  color: var(--ls-text-dim);
  font-size: 0.78rem;
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

.welcome {
  width: min(420px, calc(100% - 48px));
  text-align: center;
  padding: var(--ls-space-6);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-lg);
  background: var(--ls-bg-elevated);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.welcome__eyebrow {
  margin: 0 0 var(--ls-space-2);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ls-text-muted);
}

.welcome__title {
  margin: 0 0 var(--ls-space-3);
  font-family: var(--ls-font-display);
  font-size: 2rem;
  letter-spacing: 0.02em;
}

.welcome__text {
  margin: 0 0 var(--ls-space-3);
  color: var(--ls-text-muted);
  font-size: 0.95rem;
}

.welcome__hint {
  margin: 0;
  color: var(--ls-text-dim);
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>
