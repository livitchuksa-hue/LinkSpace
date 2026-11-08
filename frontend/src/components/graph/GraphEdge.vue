<template>
  <line
    v-if="source && target"
    class="edge"
    :x1="(source.x || 0) + 70"
    :y1="(source.y || 0) + 24"
    :x2="(target.x || 0) + 70"
    :y2="(target.y || 0) + 24"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  edge: { type: Object, required: true },
  nodes: { type: Array, default: () => [] },
});

const source = computed(() => props.nodes.find((n) => n.id === props.edge.sourceId));
const target = computed(() => props.nodes.find((n) => n.id === props.edge.targetId));
</script>

<style scoped>
.edge {
  stroke: #4a5670;
  stroke-width: 2;
}
</style>
