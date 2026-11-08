<template>
  <div class="details">
    <p class="details__title">{{ object.title }}</p>
    <p class="details__type muted">{{ typeLabel }}</p>
    <p v-if="object.description" class="details__desc">{{ object.description }}</p>
    <dl class="details__meta">
      <div>
        <dt>ID</dt>
        <dd>{{ object.id }}</dd>
      </div>
      <div v-if="object.path">
        <dt>Путь</dt>
        <dd>{{ object.path }}</dd>
      </div>
      <div v-if="object.url">
        <dt>URL</dt>
        <dd>{{ object.url }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  object: { type: Object, required: true },
});

const labels = {
  NOTE: 'Заметка',
  FILE: 'Файл',
  FOLDER: 'Папка',
  LINK: 'Ссылка',
};

const typeLabel = computed(() => labels[props.object.type] || props.object.type);
</script>

<style scoped>
.details__title {
  margin: 0 0 4px;
  font-size: 1.05rem;
  font-weight: 600;
}

.details__type {
  margin: 0 0 var(--ls-space-3);
  font-size: 0.85rem;
}

.details__desc {
  margin: 0 0 var(--ls-space-4);
  color: var(--ls-text-muted);
  font-size: 0.9rem;
}

.details__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-3);
}

.details__meta dt {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ls-text-dim);
}

.details__meta dd {
  margin: 2px 0 0;
  font-size: 0.88rem;
  word-break: break-word;
}
</style>
