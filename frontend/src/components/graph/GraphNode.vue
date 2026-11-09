<template>
  <div
    class="graph-node"
    :style="nodePosition"
    @pointerdown.stop="onPointerDown"
    @click.stop="onClick"
    @dblclick.stop="onDoubleClick"
    @contextmenu.stop.prevent="$emit('context', $event, node)"
  >
    <div
      class="node"
      :class="{
        'node--selected': selected,
        'node--connect-source': connectSource,
        'node--missing': node.missing,
        'node--photo': photoUrl,
      }"
      :style="nodeStyle"
    >
      <div class="node__inner" :style="innerStyle">
        <img
          v-if="photoUrl"
          class="node__photo"
          :src="photoUrl"
          alt=""
          draggable="false"
        />
        <div v-if="photoUrl" class="node__photo-fade" />
        <div class="node__header">
          <span
            v-if="uiStore.graphFields.type"
            class="node__kind"
            :style="{ background: appearance.bg, color: appearance.fg }"
          >
            <TypeIcon :type="node.type" />
          </span>
          <span v-if="uiStore.graphFields.title" class="node__title">{{ node.title }}</span>
          <span v-if="node.missing" class="node__missing" title="Файл не найден">!</span>
        </div>

        <p v-if="previewText" class="node__content">{{ previewText }}</p>
        <p v-if="filePreview" class="node__content node__content--file">{{ filePreview }}</p>

        <div class="node__meta">
          <span v-if="uiStore.graphFields.disk && node.disk"><em class="node__meta-label">Диск</em>{{ node.disk }}</span>
          <span v-if="uiStore.graphFields.createdDate && node.createdAt"><em class="node__meta-label">Созд.</em>{{ formatDate(node.createdAt) }}</span>
          <span v-if="uiStore.graphFields.updatedDate && node.updatedAt"><em class="node__meta-label">Изм.</em>{{ formatDate(node.updatedAt) }}</span>
          <span v-if="uiStore.graphFields.openedDate && node.lastOpenedAt"><em class="node__meta-label">Откр.</em>{{ formatDate(node.lastOpenedAt) }}</span>
        </div>

        <div v-if="uiStore.graphFields.tags && nodeTags.length" class="node__tags">
          <span
            v-for="tag in nodeTags"
            :key="tag.name"
            class="node__tag"
            :style="{ background: tag.color, color: readableOn(tag.color) }"
          >
            {{ tag.name }}
          </span>
        </div>
      </div>

      <span
        class="node__resize"
        title="Изменить размер"
        @pointerdown.stop="$emit('resize-start', $event, node)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { NODE_HEIGHT, NODE_WIDTH } from '../../utils/graphGeometry';
import { formatDate } from '../../utils/formatters';
import { isImageNode, isTextNode, nodeAppearance, readableOn } from '../../utils/nodeAppearance';
import { markdownPlainText } from '../../utils/markdown';
import { parseTags } from '../../utils/tags';
import { uiStore } from '../../stores/uiStore';
import { graphStore } from '../../stores/graphStore';
import { useElectron } from '../../composables/useElectron';
import TypeIcon from '../common/TypeIcon.vue';

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  connectSource: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['move-start', 'select', 'edit', 'resize-start', 'context']);

const appearance = computed(() => nodeAppearance(props.node));
const nodeWidth = computed(() => Math.max(140, Number(props.node.width) || NODE_WIDTH));
const nodeHeight = computed(() => Math.max(80, Number(props.node.height) || NODE_HEIGHT));

const nodePosition = computed(() => ({
  width: `${nodeWidth.value}px`,
  height: `${nodeHeight.value}px`,
  transform: `translate(${props.node.x || 0}px, ${props.node.y || 0}px)`,
}));

const nodeTags = computed(() => parseTags(props.node.tags).slice(0, 4));

const contentScale = computed(() => {
  const zoom = graphStore.view.scale || 1;
  const zoomComp = Math.min(1.35, Math.max(0.75, 1 / zoom));
  const scale = Math.min(nodeWidth.value / NODE_WIDTH, nodeHeight.value / NODE_HEIGHT) * zoomComp;
  return Math.min(2.5, Math.max(0.5, scale));
});

const innerStyle = computed(() => {
  const padding = 20;
  return {
    width: `${Math.max(80, (nodeWidth.value - padding) / contentScale.value)}px`,
    height: `${Math.max(48, (nodeHeight.value - padding) / contentScale.value)}px`,
    transform: `scale(${contentScale.value})`,
  };
});

const { readDataUrl, readText } = useElectron();

const filePreview = ref('');

watch(
  () => [props.node.type, props.node.path, props.node.title, props.node.missing],
  async () => {
    filePreview.value = '';
    const targetPath = props.node.path;
    const isExternalText = isTextNode(props.node)
      || (props.node.type === 'NOTE' && Boolean(targetPath));
    if (!isExternalText || !targetPath || props.node.missing) return;
    const result = await readText(targetPath);
    if (result?.ok && props.node.path === targetPath) {
      filePreview.value = props.node.type === 'NOTE'
        ? markdownPlainText(result.text)
        : result.text.slice(0, 1200);
    }
  },
  { immediate: true },
);

const photoUrl = ref(null);

watch(
  () => [props.node.type, props.node.path, props.node.title, props.node.missing],
  async () => {
    photoUrl.value = null;
    const targetPath = props.node.path;
    if (!isImageNode(props.node) || !targetPath || props.node.missing) return;
    const result = await readDataUrl(targetPath);
    if (result?.ok && props.node.path === targetPath) {
      photoUrl.value = result.dataUrl;
    }
  },
  { immediate: true },
);

const previewText = computed(() => {
  if (props.node.type === 'NOTE') {
    if (props.node.path) return '';
    return markdownPlainText(props.node.content || '', 600);
  }
  return props.node.description || '';
});

const nodeStyle = computed(() => ({
  borderColor: props.selected ? '#ffffff' : appearance.value.border,
  boxShadow: props.selected ? '0 0 0 1px #ffffff' : `inset 3px 0 0 ${appearance.value.border}`,
}));

function onPointerDown(event) {
  emit('move-start', event, props.node);
}

function onClick() {
  emit('select', props.node.id);
}

function onDoubleClick() {
  emit('edit', props.node.id);
}
</script>

<style scoped>
.graph-node {
  position: absolute;
  left: 0;
  top: 0;
  cursor: grab;
  z-index: 1;
}

.node {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 10px 12px;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  background: var(--ls-bg-panel);
  color: var(--ls-text);
  font-size: 0.82rem;
  overflow: hidden;
  user-select: none;
}

.node--selected {
  border-color: #fff;
}

.node--connect-source {
  outline: 2px solid #fff;
  outline-offset: 1px;
}

.node__inner {
  position: absolute;
  left: 10px;
  top: 10px;
  right: auto;
  bottom: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
  transform-origin: 0 0;
  overflow: hidden;
}

.node__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  pointer-events: none;
  user-select: none;
}

.node__photo-fade {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    rgba(8, 8, 10, 0.88) 0%,
    rgba(8, 8, 10, 0.62) 34%,
    rgba(8, 8, 10, 0.3) 58%,
    rgba(8, 8, 10, 0.68) 100%
  );
  pointer-events: none;
}

.node__header,
.node__content,
.node__meta,
.node__tags {
  position: relative;
}

.node__header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.node__kind {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 5px;
}

.node__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.node__missing {
  margin-left: auto;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ff6b6b;
  border-radius: 50%;
  color: #ff6b6b;
  font-size: 0.72rem;
  font-weight: 700;
}

.node__content {
  flex: 1;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ls-text-muted);
  font-size: 0.74rem;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
}

.node__content--file {
  flex: 0 1 auto;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 0.68rem;
  opacity: 0.85;
  border-top: 1px dashed rgba(255, 255, 255, 0.14);
  padding-top: 5px;
}

.node__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  color: var(--ls-text-dim);
  font-size: 0.7rem;
}

.node__meta-label {
  font-style: normal;
  color: var(--ls-text-dim);
  opacity: 0.75;
  margin-right: 5px;
}

.node__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.node__tag {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}

.node__resize {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 12px;
  height: 12px;
  border-right: 2px solid var(--ls-text-dim);
  border-bottom: 2px solid var(--ls-text-dim);
  cursor: nwse-resize;
}

.node--photo .node__title,
.node--photo .node__content,
.node--photo .node__meta,
.node--photo .node__meta-label,
.node--photo .node__tag {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.55);
}
</style>
