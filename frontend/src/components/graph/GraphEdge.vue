<template>
  <g v-if="source && target" class="edge" :class="{ 'edge--selected': selected, 'edge--dimmed': dimmed }" @pointerdown.stop @click.stop="$emit('select')" @contextmenu.stop.prevent="$emit('context', $event, edge)">
    <path
      class="edge__hit"
      :d="pathD"
      stroke-linecap="round"
    />
    <path
      class="edge__line"
      :d="pathD"
      stroke-linecap="round"
      :style="{ '--edge-color': edgeColor }"
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
import { midpoint, nodeCenter } from '../../utils/graphGeometry';
import { graphStore } from '../../stores/graphStore';
import { uiStore } from '../../stores/uiStore';
import { edgeDimmed } from '../../utils/filters';

const props = defineProps({
  edge: { type: Object, required: true },
  nodes: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
});

defineEmits(['select', 'context']);

const source = computed(() => props.nodes.find((n) => n.id === props.edge.sourceId));
const target = computed(() => props.nodes.find((n) => n.id === props.edge.targetId));
const sourceCenter = computed(() => nodeCenter(source.value || { x: 0, y: 0 }));
const targetCenter = computed(() => nodeCenter(target.value || { x: 0, y: 0 }));
const pathD = computed(() => {
  const sx = sourceCenter.value.x;
  const sy = sourceCenter.value.y;
  const tx = targetCenter.value.x;
  const ty = targetCenter.value.y;
  const c = Math.max(-160, Math.min(160, (tx - sx) * 0.5));
  return `M ${sx} ${sy} C ${sx + c} ${sy}, ${tx - c} ${ty}, ${tx} ${ty}`;
});

const labelPoint = computed(() => midpoint(sourceCenter.value, targetCenter.value));
const edgeColor = computed(() => props.edge.color || '#8f8f8f');
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

.edge__line {
  stroke: var(--edge-color, #7a7a7a);
  stroke-width: 1.3;
  fill: none;
  transition: stroke-width var(--ls-transition);
}

.edge:hover .edge__line,
.edge--selected .edge__line {
  stroke-width: 2;
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
