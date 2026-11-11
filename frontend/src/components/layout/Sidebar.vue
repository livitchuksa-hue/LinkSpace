<template>
  <aside class="panel sidebar">
    <div class="sidebar__section">
      <p class="sidebar__label">Создать</p>
      <div class="sidebar__tools sidebar__tools--grid">
        <button
          v-for="tool in createTools"
          :key="tool.type"
          class="sidebar__tool"
          type="button"
          @click="tool.action"
        >
          <TypeIcon :type="tool.type" class="sidebar__tool-icon" />
          <span>{{ tool.label }}</span>
        </button>
      </div>
    </div>

    <div class="sidebar__section">
      <p class="sidebar__label">Инструменты</p>
      <div class="sidebar__tools sidebar__tools--row">
        <button
          class="sidebar__tool sidebar__tool--wide"
          :class="{ 'sidebar__tool--active': uiStore.tool === 'connect' }"
          type="button"
          @click="toggleTool('connect')"
        >
          <UiIcon name="connect" class="sidebar__tool-icon" />
          <span>Связать</span>
        </button>
        <button
          class="sidebar__tool sidebar__tool--wide"
          :class="{ 'sidebar__tool--active': uiStore.tool === 'region' }"
          type="button"
          @click="toggleTool('region')"
        >
          <UiIcon name="region" class="sidebar__tool-icon" />
          <span>Область</span>
        </button>
      </div>
      <p v-if="toolHint" class="sidebar__hint-text dim">{{ toolHint }}</p>
    </div>

    <div class="sidebar__section">
      <p class="sidebar__label">Рабочее пространство</p>
      <button class="sidebar__ws" type="button">
        <span class="sidebar__ws-dot" aria-hidden="true"></span>
        <span class="sidebar__ws-name">Основной граф</span>
      </button>
      <p class="sidebar__stats">
        {{ totalObjects }} объектов · {{ graphStore.connections.length }} связей · {{ graphStore.regions.length }} областей
      </p>
    </div>

    <div class="sidebar__section">
      <p class="sidebar__label">Типы объектов</p>
      <ul class="sidebar__list">
        <li v-for="item in typeItems" :key="item.type">
          <span class="sidebar__type">
            <span class="sidebar__type-dot" :style="{ background: item.color }"></span>
            <TypeIcon :type="item.type === 'FILE' ? 'FILE' : item.type" class="sidebar__type-icon" />
            <span>{{ item.label }}</span>
          </span>
          <span class="sidebar__count">{{ item.count }}</span>
        </li>
      </ul>
    </div>

    <p class="sidebar__foot dim">
      Данные хранятся локально в SQLite.<br />
      Файлы и папки можно перетаскивать на граф.
    </p>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { graphStore } from '../../stores/graphStore';
import { uiStore } from '../../stores/uiStore';
import { typeLabel } from '../../utils/formatters';
import { TYPE_APPEARANCE } from '../../utils/nodeAppearance';
import { useGraphActions } from '../../composables/useGraphActions';
import TypeIcon from '../common/TypeIcon.vue';
import UiIcon from '../common/UiIcon.vue';

const { openCreate, addLocalMaterial, toggleTool } = useGraphActions();

const createTools = [
  { type: 'NOTE', label: 'Заметка', action: () => openCreate('NOTE') },
  { type: 'FILE', label: 'Файл', action: () => addLocalMaterial('FILE') },
  { type: 'FOLDER', label: 'Папка', action: () => addLocalMaterial('FOLDER') },
  { type: 'LINK', label: 'Ссылка', action: () => openCreate('LINK') },
];

const typeItems = computed(() => ['NOTE', 'FILE', 'FOLDER', 'LINK'].map((type) => ({
  type,
  label: typeLabel(type),
  count: graphStore.objects.filter((item) => item.type === type).length,
  color: TYPE_APPEARANCE[type]?.border || '#8a8a8a',
})));

const totalObjects = computed(() => graphStore.objects.length);

const toolHint = computed(() => {
  if (uiStore.tool === 'connect') {
    return uiStore.connectSourceId ? 'Выберите второй узел для связи' : 'Выберите первый узел для связи';
  }
  if (uiStore.tool === 'region') return 'Рисуйте область на графе — панель инструментов сверху';
  return '';
});
</script>

<style scoped>
.sidebar {
  padding: var(--ls-space-4) var(--ls-space-3) var(--ls-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-5);
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-2);
}

.sidebar__label {
  margin: 0;
  padding: 0 var(--ls-space-2);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ls-text-faint);
}

.sidebar__tools--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.sidebar__tools--row {
  display: flex;
  gap: 6px;
}

.sidebar__tool {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--ls-control-h);
  padding: 0 10px;
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background var(--ls-transition), color var(--ls-transition), border-color var(--ls-transition);
}

.sidebar__tool:hover {
  background: var(--ls-bg-soft);
  color: var(--ls-text);
  border-color: var(--ls-border);
}

.sidebar__tool--wide {
  flex: 1;
  justify-content: flex-start;
}

.sidebar__tool--active {
  background: var(--ls-bg-soft);
  color: var(--ls-text);
  border-color: var(--ls-border);
}

.sidebar__tool-icon {
  color: var(--ls-text-dim);
  transition: color var(--ls-transition);
}

.sidebar__tool:hover .sidebar__tool-icon,
.sidebar__tool--active .sidebar__tool-icon {
  color: var(--ls-text-muted);
}

.sidebar__hint-text {
  margin: 2px var(--ls-space-2) 0;
  font-size: 0.74rem;
  line-height: 1.4;
}

.sidebar__ws {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
  background: var(--ls-bg-soft);
  color: var(--ls-text);
  font-size: 0.82rem;
  font-weight: 550;
  cursor: pointer;
  text-align: left;
}

.sidebar__ws-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ls-text);
  flex: 0 0 7px;
}

.sidebar__stats {
  margin: 0;
  padding: 0 var(--ls-space-2);
  color: var(--ls-text-dim);
  font-size: 0.74rem;
  line-height: 1.4;
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px var(--ls-space-2);
  border-radius: var(--ls-radius-sm);
  color: var(--ls-text-muted);
  font-size: 0.8rem;
}

.sidebar__list li:hover {
  background: var(--ls-bg-soft);
}

.sidebar__type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sidebar__type-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 7px;
}

.sidebar__type-icon {
  width: 13px;
  height: 13px;
  color: var(--ls-text-dim);
}

.sidebar__count {
  color: var(--ls-text-faint);
  font-size: 0.74rem;
  font-variant-numeric: tabular-nums;
}

.sidebar__foot {
  margin-top: auto;
  padding: var(--ls-space-3) var(--ls-space-2) 0;
  border-top: 1px solid var(--ls-border-subtle);
  font-size: 0.72rem;
  line-height: 1.5;
}
</style>
