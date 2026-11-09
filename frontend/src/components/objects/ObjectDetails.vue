<template>
  <div class="details">
    <p class="details__title">{{ object.title || 'Без названия' }}</p>
    <p class="details__type muted">{{ typeText }}</p>
    <p v-if="object.missing" class="details__missing">Файл или папка не найдены по сохранённому пути.</p>
    <p v-if="object.description" class="details__desc">{{ object.description }}</p>
    <div v-if="linkPreviewInfo && (linkPreviewInfo.title || linkPreviewInfo.description)" class="details__linkpreview">
      <p v-if="linkPreviewInfo.title" class="details__link-title">{{ linkPreviewInfo.title }}</p>
      <p v-if="linkPreviewInfo.description" class="details__link-desc">{{ linkPreviewInfo.description }}</p>
    </div>
    <div v-if="contentView.html" class="details__content details__content--md" v-html="contentView.html"></div>
    <p v-else-if="contentView.text" class="details__content">{{ contentView.text }}</p>

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
import { computed, ref, watch } from 'vue';
import { formatDateTime, formatSize, typeLabel } from '../../utils/formatters';
import { isTextNode, readableOn } from '../../utils/nodeAppearance';
import { renderMarkdown } from '../../utils/markdown';
import { parseLinkPreview } from '../../utils/linkPreview';
import { parseTags } from '../../utils/tags';
import { useElectron } from '../../composables/useElectron';

const { readText } = useElectron();

const props = defineProps({
  object: { type: Object, required: true },
});

const objectTags = computed(() => parseTags(props.object.tags));

const linkPreviewInfo = computed(() => (
  props.object.type === 'LINK' ? parseLinkPreview(props.object.preview) : null
));

const typeText = computed(() => {
  if ((props.object.type === 'FILE' || props.object.type === 'FOLDER') && props.object.missing) {
    return 'Материал недоступен';
  }
  return typeLabel(props.object.type);
});

const isMarkdown = computed(() => {
  if (props.object.type === 'NOTE') return true;
  return /\.(md|markdown)$/i.test(props.object.path || '');
});

const contentSource = ref('');

watch(
  () => props.object,
  async (object) => {
    contentSource.value = '';
    if (!object) return;
    if (object.type === 'NOTE' && !object.path) {
      contentSource.value = object.content || '';
      return;
    }
    const external = (object.type === 'NOTE' && object.path) || isTextNode(object);
    if (external && object.path) {
      const result = await readText(object.path);
      contentSource.value = result?.ok
        ? result.text
        : (object.type === 'NOTE' ? object.content || '' : '');
    }
  },
  { immediate: true },
);

const contentView = computed(() => {
  const text = contentSource.value;
  if (!text) return { html: '', text: '' };
  if (isMarkdown.value) return { html: renderMarkdown(text), text: '' };
  return { html: '', text };
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

.details__linkpreview {
  margin: 0 0 var(--ls-space-4);
  padding: 10px 12px;
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
  background: var(--ls-bg-soft);
}

.details__link-title {
  margin: 0 0 4px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ls-text);
}

.details__link-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ls-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.details__content--md {
  max-height: 340px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.details__content--md :deep(h1),
.details__content--md :deep(h2),
.details__content--md :deep(h3),
.details__content--md :deep(h4) {
  margin: 10px 0 4px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ls-text);
}

.details__content--md :deep(h1) { font-size: 1.15rem; }
.details__content--md :deep(h2) { font-size: 1.05rem; }

.details__content--md :deep(p) {
  margin: 0 0 6px;
}

.details__content--md :deep(ul),
.details__content--md :deep(ol) {
  margin: 0 0 6px;
  padding-left: 20px;
}

.details__content--md :deep(li) {
  margin-bottom: 2px;
}

.details__content--md :deep(code) {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 0.8em;
}

.details__content--md :deep(pre) {
  margin: 0 0 6px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  overflow-x: auto;
}

.details__content--md :deep(pre code) {
  padding: 0;
  background: none;
}

.details__content--md :deep(blockquote) {
  margin: 0 0 6px;
  padding-left: 10px;
  border-left: 3px solid var(--ls-border);
  color: var(--ls-text-dim);
}

.details__content--md :deep(a) {
  color: #8ab4ff;
}

.details__content--md :deep(table) {
  border-collapse: collapse;
  margin-bottom: 6px;
}

.details__content--md :deep(th),
.details__content--md :deep(td) {
  border: 1px solid var(--ls-border-subtle);
  padding: 3px 8px;
  font-size: 0.8rem;
}

.details__content--md :deep(hr) {
  border: none;
  border-top: 1px solid var(--ls-border-subtle);
  margin: 10px 0;
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
