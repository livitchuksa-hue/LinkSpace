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
          Организуйте заметки, файлы, папки и ссылки в одном интерактивном графе.
        </p>
        <BaseButton variant="primary" @click="openCreate('NOTE')">
          Создать первый объект
        </BaseButton>
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
import { useGraph } from '../composables/useGraph';
import { useElectron } from '../composables/useElectron';
import { useGraphActions, canvasRef, createOpen, createType, regionDraft } from '../composables/useGraphActions';

const {
  openCreate,
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

const regionHint = computed(() => {
  if (uiStore.regionToolShape === 'polygon') {
    return 'Кликайте точки контура; клик по первой точке, двойной клик или «Завершить» замыкает его';
  }
  return 'Кликните первый угол, затем противоположный — область построится по ним';
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

.welcome {
  width: min(420px, calc(100% - 48px));
  text-align: center;
  padding: var(--ls-space-6);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-lg);
  background: rgba(18, 22, 30, 0.88);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.welcome__eyebrow {
  margin: 0 0 var(--ls-space-2);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ls-accent);
}

.welcome__title {
  margin: 0 0 var(--ls-space-3);
  font-family: var(--ls-font-display);
  font-size: 2rem;
  letter-spacing: 0.02em;
}

.welcome__text {
  margin: 0 0 var(--ls-space-5);
  color: var(--ls-text-muted);
  font-size: 0.95rem;
}
</style>
