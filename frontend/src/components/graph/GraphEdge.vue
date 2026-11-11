<template>
  <g v-if="source && target" class="edge" :class="{ 'edge--selected': selected, 'edge--dimmed': dimmed }" @pointerdown.stop @click.stop="$emit('select')" @contextmenu.stop.prevent="$emit('context', $event, edge)">
    <defs>
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="startPoint.x"
        :y1="startPoint.y"
        :x2="endPoint.x"
        :y2="endPoint.y"
      >
        <stop offset="0" :stop-color="sourceTip" />
        <stop offset="0.22" :stop-color="edgeColor" />
        <stop offset="0.78" :stop-color="edgeColor" />
        <stop offset="1" :stop-color="targetTip" />
      </linearGradient>
    </defs>
    <path
      class="edge__hit"
      :d="pathD"
      stroke-linecap="round"
    />
    <path
      class="edge__glow"
      :d="pathD"
      stroke-linecap="round"
      :style="{ stroke: edgeColor }"
    />
    <path
      class="edge__line"
      :d="pathD"
      stroke-linecap="round"
      :style="{ '--edge-color': edgeColor, '--edge-grad': `url(#${gradientId})` }"
    />
    <text
      v-if="edge.label"
      class="edge__label"
      :transform="labelTransform"
      :style="{ fill: edgeColor }"
    >
      {{ edge.label }}
    </text>
  </g>
</template>

<script setup>
import { computed } from 'vue';
import { midpoint, NODE_HEIGHT, NODE_WIDTH } from '../../utils/graphGeometry';
import { graphStore } from '../../stores/graphStore';
import { uiStore } from '../../stores/uiStore';
import { edgeDimmed } from '../../utils/filters';
import { nodeAppearance } from '../../utils/nodeAppearance';

const EDGE_INSET = 20;

const props = defineProps({
  edge: { type: Object, required: true },
  nodes: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
});

defineEmits(['select', 'context']);

const source = computed(() => props.nodes.find((n) => n.id === props.edge.sourceId));
const target = computed(() => props.nodes.find((n) => n.id === props.edge.targetId));
const sourceCenter = computed(() => ({
  x: (source.value?.x || 0) + (Number(source.value?.width) || NODE_WIDTH) / 2,
  y: (source.value?.y || 0) + (Number(source.value?.height) || NODE_HEIGHT) / 2,
}));
const targetCenter = computed(() => ({
  x: (target.value?.x || 0) + (Number(target.value?.width) || NODE_WIDTH) / 2,
  y: (target.value?.y || 0) + (Number(target.value?.height) || NODE_HEIGHT) / 2,
}));

/**
 * Точка на границе карточки по направлению к другому узлу,
 * смещённая внутрь карточки — линия «вытекает» из-под неё.
 */
function borderPoint(node, towardCenter) {
  if (!node) return towardCenter;
  const w = Math.max(180, Number(node.width) || NODE_WIDTH);
  const h = Math.max(110, Number(node.height) || NODE_HEIGHT);
  const cx = (node.x || 0) + w / 2;
  const cy = (node.y || 0) + h / 2;
  const dx = towardCenter.x - cx;
  const dy = towardCenter.y - cy;
  const len = Math.hypot(dx, dy);
  if (!len) return { x: cx, y: cy };

  let t = Infinity;
  if (dx > 0) t = Math.min(t, (node.x + w - cx) / dx);
  else if (dx < 0) t = Math.min(t, (node.x - cx) / dx);
  if (dy > 0) t = Math.min(t, (node.y + h - cy) / dy);
  else if (dy < 0) t = Math.min(t, (node.y - cy) / dy);
  if (!Number.isFinite(t)) t = 0;

  const inset = Math.min(EDGE_INSET / len, t * 0.9);
  return {
    x: cx + dx * (t - inset),
    y: cy + dy * (t - inset),
  };
}

const startPoint = computed(() => borderPoint(source.value, targetCenter.value));
const endPoint = computed(() => borderPoint(target.value, sourceCenter.value));

const pathD = computed(() => {
  const sx = startPoint.value.x;
  const sy = startPoint.value.y;
  const tx = endPoint.value.x;
  const ty = endPoint.value.y;
  const c = Math.max(-160, Math.min(160, (tx - sx) * 0.5));
  return `M ${sx} ${sy} C ${sx + c} ${sy}, ${tx - c} ${ty}, ${tx} ${ty}`;
});

const labelPoint = computed(() => midpoint(startPoint.value, endPoint.value));
const edgeColor = computed(() => props.edge.color || '#8f8f8f');
const sourceTip = computed(() => nodeAppearance(source.value || {}).border || edgeColor.value);
const targetTip = computed(() => nodeAppearance(target.value || {}).border || edgeColor.value);
const gradientId = computed(() => `edge-grad-${props.edge.id}`);
const dimmed = computed(() => edgeDimmed(props.edge, props.nodes, uiStore.filter));

const labelScale = computed(() => {
  const zoom = graphStore.view.scale || 1;
  return Math.min(3.5, Math.max(0.5, 1 / zoom));
});

const labelTransform = computed(() =>
  `translate(${labelPoint.value.x} ${labelPoint.value.y}) scale(${labelScale.value})`,
);
</script>

<style scoped>
.edge {
  cursor: pointer;
  transition: opacity 0.25s ease;
}

.edge--dimmed {
  opacity: 0.15;
}

.edge__hit {
  stroke: transparent;
  stroke-width: 14;
  fill: none;
}

.edge__glow {
  stroke-width: 7;
  fill: none;
  opacity: 0.13;
}

.edge__line {
  stroke: var(--edge-grad, var(--edge-color, #7a7a7a));
  stroke-width: 3.4;
  fill: none;
  transition: stroke-width var(--ls-transition);
}

.edge:hover .edge__line,
.edge--selected .edge__line {
  stroke-width: 4.4;
}

.edge--selected .edge__line {
  stroke: #ffffff;
}

.edge__label {
  fill: #bdbdbd;
  font-size: 11px;
  text-anchor: middle;
  dominant-baseline: central;
  paint-order: stroke;
  stroke: #0c0e11;
  stroke-width: 3px;
}
</style>
