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
    @contextmenu.prevent="onCanvasContext"
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
          v-if="regionPreview?.kind === 'poly'"
          class="preview"
          :points="regionPreview.points"
        />
        <path
          v-else-if="regionPreview?.kind === 'path'"
          class="preview"
          :d="regionPreview.d"
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
        :multi-selected="selectedObjectIds.includes(node.id)"
        :connect-source="connectSourceId === node.id"
        @move-start="onNodePointerDown"
        @resize-start="onNodeResizeStart"
        @select="onNodeSelect"
        @edit="onNodeEdit"
        @context="onNodeContext"
      />

      <svg class="world__labels" :width="svgSize" :height="svgSize">
        <text
          v-for="label in regionLabels"
          :key="`region-label-${label.id}`"
          class="region-label"
          :transform="label.transform"
        >
          {{ label.name }}
        </text>
      </svg>
    </div>

    <div v-if="dropActive" class="drop-hint">Отпустите файлы или папку, чтобы добавить на граф</div>
    <div
      v-if="bandStyle"
      class="selection-band"
      :style="bandStyle"
    ></div>
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
import { NODE_HEIGHT, NODE_WIDTH } from '../../utils/graphGeometry';

const props = defineProps({
  objects: { type: Array, default: () => [] },
  connections: { type: Array, default: () => [] },
  regions: { type: Array, default: () => [] },
  selectedId: { type: [Number, String], default: null },
  selectedObjectIds: { type: Array, default: () => [] },
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
  'select-nodes',
]);

const root = ref(null);
const dropActive = ref(false);
const pendingRegion = ref(null);
const contextMenu = ref(null);
const canvasPress = ref(null);
const band = ref(null);
const bandRect = ref(null);
const svgSize = 12000;

const sortedObjects = computed(() => sortByLayer(props.objects));
const sortedConnections = computed(() => sortByLayer(props.connections));
const sortedRegions = computed(() => sortByLayer(props.regions));

function regionLabelData(region) {
  let coords = region.coordinates;
  if (typeof coords === 'string') {
    try {
      coords = JSON.parse(coords);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(coords) || coords.length < 3) return null;
  const points = coords
    .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (points.length < 3) return null;
  const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const zoom = graphStore.view.scale || 1;
  const scale = Math.min(3.5, Math.max(0.5, 1 / zoom));
  return {
    id: region.id,
    name: region.name,
    transform: `translate(${cx} ${cy}) scale(${scale})`,
  };
}

const regionLabels = computed(() => sortedRegions.value
  .filter((region) => region.name)
  .map(regionLabelData)
  .filter(Boolean));

function openContextMenu(event, kind, item) {
  event.preventDefault();
  contextMenu.value = {
    x: event.clientX,
    y: event.clientY,
    kind,
    id: item?.id,
    point: item?.point,
  };
}

function onCanvasContext(event) {
  if (event.shiftKey || band.value) return;
  if (!root.value) return;
  const world = clientToWorld(
    event.clientX,
    event.clientY,
    root.value.getBoundingClientRect(),
    graphStore.view,
  );
  openContextMenu(event, 'canvas', { point: world });
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
  props.tool === 'region' ? regionPreviewPoints() : null
));

function handleWheel(event) {
  if (!root.value) return;
  onWheel(event, root.value);
}

const bandStyle = computed(() => {
  if (!band.value || !bandRect.value) return null;
  const rect = bandRect.value;
  const current = band.value;
  const x1 = Math.min(current.x1, current.x2) - rect.left;
  const y1 = Math.min(current.y1, current.y2) - rect.top;
  return {
    left: `${x1}px`,
    top: `${y1}px`,
    width: `${Math.abs(current.x2 - current.x1)}px`,
    height: `${Math.abs(current.y2 - current.y1)}px`,
  };
});

function handlePointerDown(event) {
  if (event.button === 0 && event.shiftKey && props.tool === 'select') {
    event.preventDefault();
    capturePointer(event);
    band.value = {
      x1: event.clientX,
      y1: event.clientY,
      x2: event.clientX,
      y2: event.clientY,
    };
    bandRect.value = root.value?.getBoundingClientRect() || null;
    return;
  }
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

function onNodeSelect(id, event) {
  const node = props.objects.find((item) => item.id === id);
  if (node) emit('select-node', node, event);
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
  if (band.value) {
    band.value = { ...band.value, x2: event.clientX, y2: event.clientY };
  }
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

function handlePointerUp(event) {
  if (band.value) {
    const start = band.value;
    band.value = null;
    bandRect.value = null;
    finishBand(start);
  }
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

function finishBand(start) {
  if (!root.value) return;
  const rect = root.value.getBoundingClientRect();
  const view = graphStore.view;
  const a = clientToWorld(start.x1, start.y1, rect, view);
  const b = clientToWorld(start.x2, start.y2, rect, view);
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x);
  const y2 = Math.max(a.y, b.y);
  if (x2 - x1 < 8 && y2 - y1 < 8) return;
  const ids = props.objects
    .filter((node) => {
      const w = Math.max(180, Number(node.width) || NODE_WIDTH);
      const h = Math.max(110, Number(node.height) || NODE_HEIGHT);
      return node.x < x2 && node.x + w > x1 && node.y < y2 && node.y + h > y1;
    })
    .map((node) => node.id);
  if (ids.length) emit('select-nodes', ids);
  else emit('select-canvas');
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
  user-select: none;
  -webkit-user-select: none;
  background-image: radial-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 30px 30px;
  background-position: center center;
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

.world__labels {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 2;
}

.region-label {
  fill: #d8d8d8;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-anchor: middle;
  dominant-baseline: central;
  paint-order: stroke;
  stroke: #0a0a0a;
  stroke-width: 4px;
  user-select: none;
}

.preview {
  fill: rgba(255, 255, 255, 0.07);
  stroke: #fff;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

.selection-band {
  position: absolute;
  z-index: 30;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.07);
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
