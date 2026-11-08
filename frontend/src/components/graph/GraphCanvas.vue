<template>
  <div class="canvas" @click="onCanvasClick">
    <svg class="canvas__svg" aria-hidden="true">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <GraphRegion
        v-for="region in regions"
        :key="`region-${region.id}`"
        :region="region"
      />
      <GraphEdge
        v-for="edge in connections"
        :key="`edge-${edge.id}`"
        :edge="edge"
        :nodes="objects"
      />
      <GraphNode
        v-for="node in objects"
        :key="`node-${node.id}`"
        :node="node"
      />
    </svg>

    <div v-if="!objects.length" class="canvas__empty">
      <slot />
    </div>
  </div>
</template>

<script setup>
import GraphNode from './GraphNode.vue';
import GraphEdge from './GraphEdge.vue';
import GraphRegion from './GraphRegion.vue';
import { useGraphInteraction } from '../../composables/useGraphInteraction';

defineProps({
  objects: { type: Array, default: () => [] },
  connections: { type: Array, default: () => [] },
  regions: { type: Array, default: () => [] },
});

const { onCanvasClick } = useGraphInteraction();
</script>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.canvas__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.canvas__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.canvas__empty > :deep(*) {
  pointer-events: auto;
}
</style>
