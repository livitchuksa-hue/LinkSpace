<template>
  <polygon
    v-if="points"
    class="region"
    :points="points"
    :fill="region.color || 'rgba(79, 140, 255, 0.12)'"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  region: { type: Object, required: true },
});

/**
 * coordinates ожидаются как JSON-строка массива точек [{x,y}, ...]
 * либо уже как массив.
 */
const points = computed(() => {
  let coords = props.region.coordinates;
  if (!coords) return '';

  if (typeof coords === 'string') {
    try {
      coords = JSON.parse(coords);
    } catch {
      return '';
    }
  }

  if (!Array.isArray(coords) || coords.length < 3) return '';
  return coords.map((p) => `${p.x},${p.y}`).join(' ');
});
</script>

<style scoped>
.region {
  stroke: rgba(79, 140, 255, 0.35);
  stroke-width: 1;
}
</style>
