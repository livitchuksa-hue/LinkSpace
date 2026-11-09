<template>
  <div
    ref="root"
    class="canvas"
    :class="{ 'canvas--drop': dropActive, 'canvas--region': tool === 'region' }"
    tabindex="0"
    @wheel.prevent="handleWheel"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @pointerleave="handlePointerUp"
    @dblclick="handleDoubleClick"
    @dragenter.prevent="dropActive = true"
    @dragover.prevent="dropActive = true"
    @dragleave.prevent="dropActive = false"
    @drop.prevent="handleDrop"
  >
    <div class="world" :style="worldStyle">
      <svg class="world__svg" :width="svgSize" :height="svgSize">
        <GraphRegion
          v-for="region in sortedRegions"
          :key="`region-${region.id}`"
          :region="region"
          :selected="selectedRegionId === region.id"
          @select="$emit('select-region', region)"
          @fill-press="(event) => onRegionFillPress(event, region)"
          @stroke-press="(event) => onRegionStrokePress(event, region)"
          @vertex-drag="(event, index) => { capturePointer(event); startRegionVertexDrag(event, region, index); }"
          @midpoint-drag="(event, index) => { capturePointer(event); startRegionMidpointDrag(event, region, index); }"
          @resize-drag="(event) => { capturePointer(event); startRegionResizeDrag(event, region); }"
          @context="onRegionContext"
        />
        <polygon
          v-if="regionPreview"
          class="preview"
          :points="regionPreview"
        />
        <GraphEdge
          v-for="edge in sortedConnections"
          :key="`edge-${edge.id}`"
          :edge="edge"
          :nodes="objects"
          :selected="selectedConnectionId === edge.id"
          @select="$emit('select-edge', edge)"
          @context="onEdgeContext"
        />
      </svg>

      <GraphNode
        v-for="node in sortedObjects"
        :key="`node-${node.id}`"
        :node="node"
        :selected="selectedId === node.id"
        :connect-source="connectSourceId === node.id"
        @move-start="onNodePointerDown"
        @resize-start="onNodeResizeStart"
        @select="onNodeSelect"
        @edit="onNodeEdit"
        @context="onNodeContext"
      />
    </div>

    <div v-if="dropActive" class="drop-hint">Отпустите файлы или папку, чтобы добавить на граф</div>
    <GraphContextMenu
      :menu="contextMenu"
      @action="onContextAction"
      @close="contextMenu = null"
    />
    <div v-if="!objects.length" class="canvas__empty">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import GraphNode from './GraphNode.vue';
import GraphEdge from './GraphEdge.vue';
import GraphRegion from './GraphRegion.vue';
import GraphContextMenu from './GraphContextMenu.vue';
import { graphStore } from '../../stores/graphStore';
import { useGraphInteraction } from '../../composables/useGraphInteraction';
import { sortByLayer } from '../../composables/useGraph';

const props = defineProps({
  objects: { type: Array, default: () => [] },
  connections: { type: Array, default: () => [] },
  regions: { type: Array, default: () => [] },
  selectedId: { type: [Number, String], default: null },
  selectedConnectionId: { type: [Number, String], default: null },
  selectedRegionId: { type: [Number, String], default: null },
  connectSourceId: { type: [Number, String], default: null },
  tool: { type: String, default: 'select' },
});

const emit = defineEmits([
  'select-canvas',
  'select-node',
  'open-node',
  'select-edge',
  'select-region',
  'move-end',
  'resize-end',
  'region-complete',
  'region-move-end',
  'drop-files',
  'context-action',
]);

const root = ref(null);
const dropActive = ref(false);
const pendingRegion = ref(null);
const contextMenu = ref(null);
const canvasPress = ref(null);
const svgSize = 12000;

const sortedObjects = computed(() => sortByLayer(props.objects));
const sortedConnections = computed(() => sortByLayer(props.connections));
const sortedRegions = computed(() => sortByLayer(props.regions));

function openContextMenu(event, kind, item) {
  event.preventDefault();
  contextMenu.value = {
    x: event.clientX,
    y: event.clientY,
    kind,
    id: item?.id,
  };
}

function onNodeContext(event, node) {
  openContextMenu(event, 'object', node);
}

function onEdgeContext(event, edge) {
  openContextMenu(event, 'connection', edge);
}

function onRegionContext(event, region) {
  openContextMenu(event, 'region', region);
}

function onContextAction(payload) {
  emit('context-action', payload);
}

const {
  interaction,
  onWheel,
  startPan,
  startPanFrom,
  startNodeDrag,
  startNodeResize,
  startRegionDrag,
  startRegionVertexDrag,
  startRegionMidpointDrag,
  startRegionResizeDrag,
  addRegionPoint,
  finishRegion,
  cancelRegion,
  onPointerMove,
  onPointerUp,
  regionPreviewPoints,
  clientToWorld,
} = useGraphInteraction({
  onMoveEnd: (id, x, y) => emit('move-end', { id, x, y }),
  onResizeEnd: (id, width, height) => emit('resize-end', { id, width, height }),
  onRegionComplete: (points, shape) => emit('region-complete', points, shape),
  onRegionMoveEnd: (id, coordinates) => emit('region-move-end', { id, coordinates }),
});

const worldStyle = computed(() => ({
  transform: `translate(${graphStore.view.x}px, ${graphStore.view.y}px) scale(${graphStore.view.scale})`,
}));

const regionPreview = computed(() => (
  props.tool === 'region' ? regionPreviewPoints() : ''
));

function handleWheel(event) {
  if (!root.value) return;
  onWheel(event, root.value);
}

function handlePointerDown(event) {
  if (event.button !== 0) return;
  capturePointer(event);

  if (props.tool === 'region') {
    addRegionPoint(event, root.value);
    return;
  }

  canvasPress.value = { x: event.clientX, y: event.clientY, dragged: false };
  startPan(event);
}

function onNodePointerDown(event, node) {
  if (event.button !== 0) return;
  capturePointer(event);
  emit('select-node', node, event);
  startNodeDrag(event, node);
}

function onNodeResizeStart(event, node) {
  if (event.button !== 0) return;
  capturePointer(event);
  startNodeResize(event, node);
}

function onNodeSelect(id) {
  const node = props.objects.find((item) => item.id === id);
  if (node) emit('select-node', node);
}

function onNodeEdit(id) {
  const node = props.objects.find((item) => item.id === id);
  if (!node) return;
  if (node.type === 'NOTE') {
    emit('select-node', node);
  } else {
    emit('open-node', node);
  }
}

function capturePointer(event) {
  try {
    root.value?.setPointerCapture?.(event.pointerId);
  } catch {
    // pointerId может быть уже неактивен — перетаскивание всё равно работает через события холста
  }
}

function onRegionFillPress(event, region) {
  if (event.button !== 0) return;
  if (props.tool === 'region') {
    addRegionPoint(event, root.value);
    return;
  }
  if (props.tool === 'select' && props.selectedRegionId === region.id) {
    capturePointer(event);
    startRegionDrag(event, region);
    return;
  }
  pendingRegion.value = {
    region,
    x: event.clientX,
    y: event.clientY,
  };
  capturePointer(event);
}

function onRegionStrokePress(event, region) {
  if (event.button !== 0) return;
  if (props.tool === 'region') {
    addRegionPoint(event, root.value);
    return;
  }
  capturePointer(event);
  emit('select-region', region);
  startRegionDrag(event, region);
}

function handlePointerMove(event) {
  if (canvasPress.value && !canvasPress.value.dragged) {
    const press = canvasPress.value;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 4) {
      press.dragged = true;
    }
  }
  if (pendingRegion.value) {
    const dx = event.clientX - pendingRegion.value.x;
    const dy = event.clientY - pendingRegion.value.y;
    if (Math.hypot(dx, dy) > 4) {
      const pending = pendingRegion.value;
      pendingRegion.value = null;
      emit('select-canvas');
      startPanFrom(pending);
    }
  }
  onPointerMove(event);
}

function handlePointerUp() {
  if (canvasPress.value) {
    const press = canvasPress.value;
    canvasPress.value = null;
    if (!press.dragged) {
      emit('select-canvas');
    }
  }
  if (pendingRegion.value) {
    const pending = pendingRegion.value;
    pendingRegion.value = null;
    if (props.tool === 'select') {
      emit('select-region', pending.region);
    }
  }
  onPointerUp();
}

function handleDoubleClick() {
  if (props.tool === 'region') {
    finishRegion();
  }
}

function handleDrop(event) {
  dropActive.value = false;
  const world = root.value
    ? clientToWorld(event.clientX, event.clientY, root.value.getBoundingClientRect(), graphStore.view)
    : { x: 120, y: 120 };
  emit('drop-files', { files: Array.from(event.dataTransfer?.files || []), point: world });
}

function handleKeydown(event) {
  if (event.key === 'Escape' && props.tool === 'region') {
    cancelRegion();
  }
}

watch(() => props.tool, (tool) => {
  if (tool !== 'region') {
    cancelRegion();
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

defineExpose({ root, finishRegion, cancelRegion });
</script>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  background-position: 0 0;
  outline: none;
}

.canvas--region {
  cursor: crosshair;
}

.canvas--drop {
  outline: 1px dashed #fff;
  outline-offset: -8px;
}

.world {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  width: 12000px;
  height: 12000px;
}

.world__svg {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.world__svg :deep(.edge__hit),
.world__svg :deep(.edge__line),
.world__svg :deep(.region__outline) {
  pointer-events: stroke;
}

.world__svg :deep(.preview),
.world__svg :deep(.edge__label) {
  pointer-events: none;
}

.preview {
  fill: rgba(255, 255, 255, 0.07);
  stroke: #fff;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

.drop-hint,
.canvas__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.drop-hint {
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 1rem;
}

.canvas__empty > :deep(*) {
  pointer-events: auto;
}
</style>
