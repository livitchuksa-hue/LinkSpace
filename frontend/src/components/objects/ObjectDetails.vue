<template>
  <div class="details">
    <div class="details__head">
      <span class="details__badge" :style="badgeStyle">
        <TypeIcon :type="object.type" />
      </span>
      <div class="details__head-text">
        <p class="details__title">{{ object.title || 'Без названия' }}</p>
        <p class="details__type muted">{{ typeText }}</p>
      </div>
    </div>
    <p v-if="object.missing" class="details__missing">Файл или папка не найдены по сохранённому пути.</p>
    <p v-if="object.description" class="details__desc">{{ object.description }}</p>
    <div v-if="linkPreviewInfo && (linkPreviewInfo.title || linkPreviewInfo.description)" class="details__linkpreview">
      <p v-if="linkPreviewInfo.title" class="details__link-title">{{ linkPreviewInfo.title }}</p>
      <p v-if="linkPreviewInfo.description" class="details__link-desc">{{ linkPreviewInfo.description }}</p>
    </div>
    <template v-if="hasContent">
      <div
        v-if="!contentTruncated"
        class="details__content"
        :class="{ 'details__content--md': contentView.html }"
      >
        <div v-if="contentView.html" v-html="contentView.html"></div>
        <template v-else>{{ contentView.text }}</template>
      </div>
      <BaseButton v-else variant="ghost" class="details__more" @click="viewerOpen = true">
        Просмотреть текст
      </BaseButton>
      <div
        ref="measureEl"
        class="details__measure details__content"
        :class="{ 'details__content--md': contentView.html }"
        aria-hidden="true"
      >
        <div v-if="contentView.html" v-html="contentView.html"></div>
        <template v-else>{{ contentView.text }}</template>
      </div>
    </template>

    <BaseModal v-model="viewerOpen" :title="object.title || 'Текст'" panel-width="min(640px, calc(100% - 32px))">
      <div v-if="contentView.html" class="details__content details__content--md details__content--full" v-html="contentView.html"></div>
      <div v-else class="details__content details__content--full">{{ contentView.text }}</div>
    </BaseModal>

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

    <div class="details__group">
      <p class="details__group-title">Свойства</p>
      <dl class="details__meta">
        <div>
          <dt>Создан</dt>
          <dd>{{ formatDateTime(object.createdAt) }}</dd>
        </div>
        <div>
          <dt>Изменён</dt>
          <dd>{{ formatDateTime(object.updatedAt) }}</dd>
        </div>
        <div>
          <dt>Открыт</dt>
          <dd>{{ formatDateTime(object.lastOpenedAt) }}</dd>
        </div>
        <div v-if="object.disk">
          <dt>Диск</dt>
          <dd>{{ object.disk }}</dd>
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

    <div v-if="object.path || object.url" class="details__group">
      <p class="details__group-title">Расположение</p>
      <div v-if="object.path" class="details__loc">
        <span class="details__loc-label">Путь</span>
        <code class="details__path">{{ object.path }}</code>
        <button
          class="details__copy"
          type="button"
          :title="copiedKey === 'path' ? 'Скопировано' : 'Копировать путь'"
          @click="copyText(object.path, 'path')"
        >
          <UiIcon :name="copiedKey === 'path' ? 'check' : 'copy'" />
        </button>
      </div>
      <div v-if="object.url" class="details__loc">
        <span class="details__loc-label">URL</span>
        <code class="details__path">{{ object.url }}</code>
        <button
          class="details__copy"
          type="button"
          :title="copiedKey === 'url' ? 'Скопировано' : 'Копировать URL'"
          @click="copyText(object.url, 'url')"
        >
          <UiIcon :name="copiedKey === 'url' ? 'check' : 'copy'" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { formatDateTime, formatSize, typeLabel } from '../../utils/formatters';
import { isTextNode, nodeAppearance, readableOn, softTone } from '../../utils/nodeAppearance';
import { renderMarkdown } from '../../utils/markdown';
import { parseLinkPreview } from '../../utils/linkPreview';
import { parseTags } from '../../utils/tags';
import { useElectron } from '../../composables/useElectron';
import BaseButton from '../common/BaseButton.vue';
import BaseModal from '../common/BaseModal.vue';
import TypeIcon from '../common/TypeIcon.vue';
import UiIcon from '../common/UiIcon.vue';

const { readText } = useElectron();

const props = defineProps({
  object: { type: Object, required: true },
});

const objectTags = computed(() => parseTags(props.object.tags));

const badgeStyle = computed(() => softTone(nodeAppearance(props.object).border));

const copiedKey = ref(null);
let copyTimer = null;

async function copyText(text, key) {
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = key;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copiedKey.value = null; }, 1400);
  } catch {
    // clipboard может быть недоступен — просто игнорируем
  }
}

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

const hasContent = computed(() => Boolean(contentView.value.html || contentView.value.text));

const measureEl = ref(null);
const contentTruncated = ref(false);
const viewerOpen = ref(false);

watch(contentView, async () => {
  await nextTick();
  const el = measureEl.value;
  contentTruncated.value = Boolean(el && el.scrollHeight > 215);
});
</script>

<style scoped>
.details {
  position: relative;
}

.details__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--ls-space-3);
}

.details__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 8px;
  border: 1px solid transparent;
}

.details__badge :deep(svg) {
  width: 15px;
  height: 15px;
}

.details__head-text {
  min-width: 0;
}

.details__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
}

.details__type {
  margin: 1px 0 0;
  font-size: 0.76rem;
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
  border-radius: var(--ls-radius-md);
  background: var(--ls-bg-soft);
  color: var(--ls-text-muted);
  font-size: 0.85rem;
  line-height: 1.45;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: hidden;
}

.details__more {
  align-self: flex-start;
  margin-bottom: var(--ls-space-4);
}

.details__measure {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  max-height: none;
  overflow: visible;
  visibility: hidden;
  pointer-events: none;
}

.details__content--full,
.details__content--md.details__content--full {
  max-height: none;
  overflow: visible;
}

.details__linkpreview {
  margin: 0 0 var(--ls-space-4);
  padding: 10px 12px;
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-md);
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
  max-height: 200px;
  overflow: hidden;
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
  color: var(--ls-text);
  text-decoration: underline;
  text-underline-offset: 2px;
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

.details__group {
  margin-bottom: var(--ls-space-4);
}

.details__group:last-child {
  margin-bottom: 0;
}

.details__group-title {
  margin: 0 0 var(--ls-space-1);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ls-text-faint);
}

.details__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.details__meta > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--ls-space-3);
  padding: 6px 0;
  border-top: 1px solid var(--ls-border-subtle);
}

.details__meta > div:first-child {
  border-top: none;
  padding-top: 2px;
}

.details__meta dt {
  flex: 0 0 auto;
  font-size: 0.72rem;
  color: var(--ls-text-dim);
}

.details__meta dd {
  margin: 0;
  font-size: 0.8rem;
  text-align: right;
  word-break: break-word;
}

.details__loc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px solid var(--ls-border-subtle);
}

.details__loc:first-of-type {
  border-top: none;
  padding-top: 2px;
}

.details__loc-label {
  flex: 0 0 34px;
  font-size: 0.72rem;
  color: var(--ls-text-dim);
}

.details__path {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.74rem;
  color: var(--ls-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
}

.details__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border: 1px solid transparent;
  border-radius: var(--ls-radius-sm);
  background: transparent;
  color: var(--ls-text-dim);
  cursor: pointer;
  transition: color var(--ls-transition), background var(--ls-transition), border-color var(--ls-transition);
}

.details__copy:hover {
  color: var(--ls-text);
  background: var(--ls-bg-soft);
  border-color: var(--ls-border-subtle);
}
</style>
