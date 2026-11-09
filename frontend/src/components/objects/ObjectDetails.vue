<template>
  <div class="details">
    <p class="details__title">{{ object.title || 'Без названия' }}</p>
    <p class="details__type muted">{{ typeText }}</p>
    <p v-if="object.missing" class="details__missing">Файл или папка не найдены по сохранённому пути.</p>
    <p v-if="object.description" class="details__desc">{{ object.description }}</p>
    <p v-if="object.type === 'NOTE' && object.content" class="details__content">{{ object.content }}</p>

    <div v-if="objectTags.length" class="details__tags">
      <span
        v-for="tag in objectTags"
        :key="tag.name"
        class="details__tag"
        :style="{ background: tag.color, color: readableOn(tag.color) }"
      >
        {{ tag.name }}
      </span>
    </div>

    <dl class="details__meta">
      <div>
        <dt>Тип</dt>
        <dd>{{ typeLabel(object.type) }}</dd>
      </div>
      <div>
        <dt>Создан</dt>
        <dd>{{ formatDateTime(object.createdAt) }}</dd>
      </div>
      <div>
        <dt>Последнее открытие</dt>
        <dd>{{ formatDateTime(object.lastOpenedAt) }}</dd>
      </div>
      <div>
        <dt>Изменён</dt>
        <dd>{{ formatDateTime(object.updatedAt) }}</dd>
      </div>
      <div v-if="object.disk">
        <dt>Диск</dt>
        <dd>{{ object.disk }}</dd>
      </div>
      <div v-if="object.path">
        <dt>Путь</dt>
        <dd class="details__path">{{ object.path }}</dd>
      </div>
      <div v-if="object.url">
        <dt>URL</dt>
        <dd class="details__path">{{ object.url }}</dd>
      </div>
      <div v-if="object.fileSize != null">
        <dt>Размер</dt>
        <dd>{{ formatSize(object.fileSize) }}</dd>
      </div>
      <div v-if="object.fileCreatedAt">
        <dt>Файл создан</dt>
        <dd>{{ formatDateTime(object.fileCreatedAt) }}</dd>
      </div>
      <div v-if="object.fileModifiedAt">
        <dt>Файл изменён</dt>
        <dd>{{ formatDateTime(object.fileModifiedAt) }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDateTime, formatSize, typeLabel } from '../../utils/formatters';
import { readableOn } from '../../utils/nodeAppearance';
import { parseTags } from '../../utils/tags';

const props = defineProps({
  object: { type: Object, required: true },
});

const objectTags = computed(() => parseTags(props.object.tags));

const typeText = computed(() => {
  if ((props.object.type === 'FILE' || props.object.type === 'FOLDER') && props.object.missing) {
    return 'Материал недоступен';
  }
  return typeLabel(props.object.type);
});
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

.details__missing {
  margin: 0 0 var(--ls-space-3);
  color: #e4e4e4;
  font-size: 0.82rem;
}

.details__desc {
  margin: 0 0 var(--ls-space-4);
  color: var(--ls-text-muted);
  font-size: 0.9rem;
}

.details__content {
  margin: 0 0 var(--ls-space-4);
  padding: 10px 12px;
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
  background: var(--ls-bg-soft);
  color: var(--ls-text-muted);
  font-size: 0.85rem;
  line-height: 1.45;
  white-space: pre-wrap;
  max-height: 160px;
  overflow: auto;
}

.details__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 var(--ls-space-4);
}

.details__tag {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
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

.details__path {
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.78rem;
}
</style>
