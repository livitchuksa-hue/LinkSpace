<template>
  <g class="node" @click.stop="select">
    <rect
      :x="node.x || 40"
      :y="node.y || 40"
      width="140"
      height="48"
      rx="10"
      class="node__shape"
    />
    <text
      :x="(node.x || 40) + 16"
      :y="(node.y || 40) + 30"
      class="node__label"
    >
      {{ node.title || 'Без названия' }}
    </text>
  </g>
</template>

<script setup>
import { uiStore } from '../../stores/uiStore';

const props = defineProps({
  node: { type: Object, required: true },
});

function select() {
  uiStore.selectedObjectId = props.node.id;
}
</script>

<style scoped>
.node {
  cursor: pointer;
}

.node__shape {
  fill: #1b2333;
  stroke: #3a4660;
  stroke-width: 1.5;
}

.node__label {
  fill: var(--ls-text);
  font-size: 13px;
}
</style>
