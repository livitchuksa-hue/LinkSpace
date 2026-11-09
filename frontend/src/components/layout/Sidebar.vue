<template>
  <aside class="panel sidebar">
    <div class="sidebar__section">
      <p class="sidebar__label">Инструменты</p>
      <div class="sidebar__tools">
        <button class="sidebar__tool" type="button" @click="openCreate('NOTE')">Заметка</button>
        <button class="sidebar__tool" type="button" @click="addLocalMaterial('FILE')">Файл</button>
        <button class="sidebar__tool" type="button" @click="addLocalMaterial('FOLDER')">Папка</button>
        <button class="sidebar__tool" type="button" @click="openCreate('LINK')">Ссылка</button>
      </div>
      <div class="sidebar__tools sidebar__tools--row">
        <button
          class="sidebar__tool"
          :class="{ 'sidebar__tool--active': uiStore.tool === 'connect' }"
          type="button"
          @click="toggleTool('connect')"
        >
          Связать
        </button>
        <button
          class="sidebar__tool"
          :class="{ 'sidebar__tool--active': uiStore.tool === 'region' }"
          type="button"
          @click="toggleTool('region')"
        >
          Область
        </button>
      </div>
      <p v-if="toolHint" class="sidebar__hint-text dim">{{ toolHint }}</p>
    </div>

    <div class="sidebar__section">
      <p class="sidebar__label">Рабочее пространство</p>
      <button class="sidebar__item sidebar__item--active" type="button">
        Основной граф
      </button>
      <p class="sidebar__stats">{{ totalObjects }} объектов · {{ graphStore.connections.length }} связей · {{ graphStore.regions.length }} областей</p>
    </div>

    <div class="sidebar__section">
      <p class="sidebar__label">Типы объектов</p>
      <ul class="sidebar__list">
        <li v-for="item in typeItems" :key="item.type">
          <span class="sidebar__chip">{{ item.label }}</span>
          <span class="sidebar__count">{{ item.count }}</span>
        </li>
      </ul>
    </div>

    <p class="sidebar__hint dim">
      Граф хранится локально в SQLite. Перетаскивайте файлы на холст.
    </p>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { graphStore } from '../../stores/graphStore';
import { uiStore } from '../../stores/uiStore';
import { typeLabel } from '../../utils/formatters';
import { useGraphActions } from '../../composables/useGraphActions';

const { openCreate, addLocalMaterial, toggleTool } = useGraphActions();

const typeItems = computed(() => ['NOTE', 'FILE', 'FOLDER', 'LINK'].map((type) => ({
  type,
  label: typeLabel(type),
  count: graphStore.objects.filter((item) => item.type === type).length,
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
  padding: var(--ls-space-5) var(--ls-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-5);
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-3);
}

.sidebar__label {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ls-text-dim);
}

.sidebar__tools {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ls-space-2);
}

.sidebar__tools--row {
  display: flex;
}

.sidebar__tool {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg-soft);
  color: var(--ls-text);
  padding: 8px 10px;
  border-radius: var(--ls-radius-sm);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
}

.sidebar__tools--row .sidebar__tool {
  flex: 1;
}

.sidebar__tool:hover {
  border-color: var(--ls-text-dim);
}

.sidebar__tool--active {
  background: var(--ls-text);
  color: var(--ls-bg);
  border-color: var(--ls-text);
}

.sidebar__hint-text {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
}

.sidebar__item {
  width: 100%;
  text-align: left;
  border: 1px solid var(--ls-border);
  background: var(--ls-bg-soft);
  color: var(--ls-text);
  padding: 8px 10px;
  border-radius: var(--ls-radius-sm);
}

.sidebar__stats {
  margin: 0;
  color: var(--ls-text-dim);
  font-size: 0.78rem;
  line-height: 1.4;
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ls-text-muted);
  font-size: 0.9rem;
}

.sidebar__count {
  color: var(--ls-text-dim);
  font-size: 0.78rem;
}

.sidebar__hint {
  margin-top: auto;
  font-size: 0.82rem;
  line-height: 1.45;
}
</style>
