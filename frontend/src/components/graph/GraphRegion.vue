<template>
  <g
    v-if="points.length >= 3"
    class="region"
    :class="{ 'region--selected': selected }"
    @contextmenu.stop.prevent="$emit('context', $event, region)"
  >
    <rect
      v-if="shapeType === 'rectangle'"
      class="region__fill"
      :x="bounds.minX"
      :y="bounds.minY"
      :width="bounds.width"
      :height="bounds.height"
      rx="18"
      :fill="region.color || '#ffffff'"
      fill-opacity="0.1"
      @pointerdown.stop="$emit('fill-press', $event)"
      @click.stop="$emit('select')"
    />
    <ellipse
      v-else-if="shapeType === 'ellipse'"
      class="region__fill"
      :cx="bounds.centerX"
      :cy="bounds.centerY"
      :rx="bounds.width / 2"
      :ry="bounds.height / 2"
      :fill="region.color || '#ffffff'"
      fill-opacity="0.1"
      @pointerdown.stop="$emit('fill-press', $event)"
      @click.stop="$emit('select')"
    />
    <path
      v-else
      class="region__fill"
      :d="smoothPath"
      :fill="region.color || '#ffffff'"
      fill-opacity="0.1"
      @pointerdown.stop="$emit('fill-press', $event)"
      @click.stop="$emit('select')"
    />

    <rect
      v-if="shapeType === 'rectangle'"
      class="region__stroke"
      :x="bounds.minX"
      :y="bounds.minY"
      :width="bounds.width"
      :height="bounds.height"
      rx="18"
      fill="none"
      :stroke="outlineColor"
      @pointerdown.stop="$emit('stroke-press', $event)"
    />
    <ellipse
      v-else-if="shapeType === 'ellipse'"
      class="region__stroke"
      :cx="bounds.centerX"
      :cy="bounds.centerY"
      :rx="bounds.width / 2"
      :ry="bounds.height / 2"
      fill="none"
      :stroke="outlineColor"
      @pointerdown.stop="$emit('stroke-press', $event)"
    />
    <path
      v-else
      class="region__stroke"
      :d="smoothPath"
      fill="none"
      :stroke="outlineColor"
      @pointerdown.stop="$emit('stroke-press', $event)"
    />

    <template v-if="selected && pointEditing">
      <rect
        class="region__resize"
        :x="bounds.maxX - 7"
        :y="bounds.maxY - 7"
        width="14"
        height="14"
        rx="3"
        @pointerdown.stop="$emit('resize-drag', $event)"
      />
      <template v-if="shapeType === 'polygon'">
        <circle
          v-for="(point, index) in points"
          :key="`vertex-${index}`"
          class="region__vertex"
          :cx="point.x"
          :cy="point.y"
          r="5"
          @pointerdown.stop="$emit('vertex-drag', $event, index)"
        />
        <circle
          v-for="(mid, index) in midpoints"
          :key="`mid-${index}`"
          class="region__midpoint"
          :cx="mid.x"
          :cy="mid.y"
          r="4"
          @pointerdown.stop="$emit('midpoint-drag', $event, index)"
        />
      </template>
    </template>
  </g>
</template>

<script setup>
import { computed } from 'vue';
import { uiStore } from '../../stores/uiStore';
import { smoothClosedPath } from '../../utils/graphGeometry';

const props = defineProps({
  region: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['select', 'fill-press', 'stroke-press', 'vertex-drag', 'midpoint-drag', 'resize-drag', 'context']);

const points = computed(() => {
  let coords = props.region.coordinates;
  if (!coords) return [];

  if (typeof coords === 'string') {
    try {
      coords = JSON.parse(coords);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(coords)) return [];
  return coords
    .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
});

const pointEditing = computed(() => Boolean(uiStore.regionDefaults.pointEditing));

const shapeType = computed(() => {
  const shape = props.region.shape || 'polygon';
  return ['rectangle', 'ellipse'].includes(shape) ? shape : 'polygon';
});

const bounds = computed(() => {
  if (!points.value.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  const xs = points.value.map((point) => point.x);
  const ys = points.value.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(8, maxX - minX),
    height: Math.max(8, maxY - minY),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
});

const midpoints = computed(() => points.value.map((point, index) => {
  const next = points.value[(index + 1) % points.value.length];
  return {
    x: (point.x + next.x) / 2,
    y: (point.y + next.y) / 2,
  };
}));

const smoothPath = computed(() => smoothClosedPath(points.value));

const outlineColor = computed(() => {
  if (props.selected) return '#ffffff';
  return props.region.color || 'rgba(255, 255, 255, 0.32)';
});
</script>

<style scoped>
.region {
  cursor: default;
}

.region__fill {
  pointer-events: visibleFill;
}

.region__stroke {
  fill: none;
  stroke-width: 1;
  stroke-dasharray: 4 4;
  stroke-opacity: 0.85;
  pointer-events: stroke;
  cursor: grab;
}

.region--selected .region__stroke {
  stroke-width: 1.8;
}

.region__vertex,
.region__midpoint,
.region__resize {
  pointer-events: all;
  cursor: grab;
}

.region__vertex {
  fill: #ffffff;
  stroke: #0a0a0a;
  stroke-width: 1.5;
}

.region__midpoint {
  fill: #cfcfcf;
  stroke: #0a0a0a;
  stroke-width: 1;
  stroke-dasharray: 2 2;
}

.region__resize {
  fill: #ffffff;
  stroke: #0a0a0a;
  stroke-width: 1.5;
  cursor: nwse-resize;
}

</style>
