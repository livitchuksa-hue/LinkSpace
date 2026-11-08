<template>
  <aside class="panel panel--right inspector">
    <h2 class="inspector__title">Свойства</h2>

    <ObjectDetails
      v-if="selectedObject"
      :object="selectedObject"
    />

    <div v-else class="inspector__empty">
      <p class="muted">Объект не выбран</p>
      <p class="dim">
        Выберите узел на графе или создайте первый объект, чтобы увидеть свойства.
      </p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import ObjectDetails from '../objects/ObjectDetails.vue';
import { uiStore } from '../../stores/uiStore';
import { graphStore } from '../../stores/graphStore';

const selectedObject = computed(() =>
  graphStore.objects.find((item) => item.id === uiStore.selectedObjectId) || null,
);
</script>

<style scoped>
.inspector {
  padding: var(--ls-space-5) var(--ls-space-4);
}

.inspector__title {
  margin: 0 0 var(--ls-space-4);
  font-size: 0.95rem;
  font-weight: 600;
}

.inspector__empty {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-2);
}

.inspector__empty p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
