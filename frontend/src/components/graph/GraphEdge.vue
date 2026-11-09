<template>
  <g v-if="source && target" class="edge" :class="{ 'edge--selected': selected }" @pointerdown.stop @click.stop="$emit('select')" @contextmenu.stop.prevent="$emit('context', $event, edge)">
    <line
      class="edge__hit"
      :x1="sourceCenter.x"
      :y1="sourceCenter.y"
      :x2="targetCenter.x"
      :y2="targetCenter.y"
    />
    <line
      class="edge__line"
      :x1="sourceCenter.x"
      :y1="sourceCenter.y"
      :x2="targetCenter.x"
      :y2="targetCenter.y"
      :style="{ stroke: edgeColor }"
    />
    <text
      v-if="edge.label"
      class="edge__label"
      :x="labelPoint.x"
      :y="labelPoint.y"
      :style="{ fill: edgeColor }"
    >
      {{ edge.label }}
    </text>
  </g>
</template>

<script setup>
import { computed } from 'vue';
import { midpoint, nodeCenter } from '../../utils/graphGeometry';

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
const labelPoint = computed(() => midpoint(sourceCenter.value, targetCenter.value));
const edgeColor = computed(() => props.edge.color || '#8f8f8f');
</script>

<style scoped>
.edge {
  cursor: pointer;
}

.edge__hit {
  stroke: transparent;
  stroke-width: 14;
}

.edge__line {
  stroke: #8f8f8f;
  stroke-width: 1.4;
}

.edge--selected .edge__line {
  stroke: #ffffff;
  stroke-width: 2.2;
}

.edge__label {
  fill: #bdbdbd;
  font-size: 11px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #0a0a0a;
  stroke-width: 3px;
}
</style>
