<template>
  <section class="settings">
    <h2>Настройки</h2>

    <div class="settings__block">
      <h3>Отображение графа</h3>
      <label v-for="field in fieldOptions" :key="field.key" class="settings__check">
        <input v-model="uiStore.graphFields[field.key]" type="checkbox" />
        <span>{{ field.label }}</span>
      </label>
      <p class="settings__hint">Поля на карточках узлов сохраняются в SQLite вместе с остальными данными графа.</p>
    </div>

    <div class="settings__block">
      <h3>Оформление</h3>
      <label class="settings__check">
        <input v-model="uiStore.liquidGlass" type="checkbox" />
        <span>Liquid Glass — стеклянные поверхности</span>
      </label>
      <p class="settings__hint">
        Полупрозрачные поверхности с размытием и бликами для шапки,
        боковых панелей, панелей инструментов и контекстных меню.
      </p>
    </div>

    <div class="settings__block">
      <h3>Области</h3>
      <label class="settings__check settings__check--column">
        <span>Форма области по умолчанию</span>
        <select v-model="uiStore.regionDefaults.shape" class="settings__select">
          <option value="polygon">Произвольный контур</option>
          <option value="rectangle">Прямоугольник</option>
          <option value="ellipse">Эллипс</option>
        </select>
      </label>
      <label class="settings__check">
        <input v-model="uiStore.regionDefaults.pointEditing" type="checkbox" />
        <span>Точки редактирования области</span>
      </label>
      <p class="settings__hint">
        При выключенных точках у выделенной области не показываются маркеры вершин,
        середин рёбер и уголок изменения размера — область можно только перемещать.
      </p>
    </div>

    <div class="settings__block">
      <h3>Подключение</h3>
      <dl class="settings__list">
        <div>
          <dt>API</dt>
          <dd>{{ apiBaseUrl }}</dd>
        </div>
        <div>
          <dt>Electron</dt>
          <dd>{{ isElectron ? 'активен' : 'браузерный режим Vite' }}</dd>
        </div>
        <div>
          <dt>Backend</dt>
          <dd>{{ backendStatus }}</dd>
        </div>
      </dl>
      <BaseButton variant="ghost" @click="checkBackend">Проверить backend</BaseButton>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../services/api';
import { objectService } from '../services/objectService';
import { useElectron } from '../composables/useElectron';
import { uiStore } from '../stores/uiStore';
import BaseButton from '../components/common/BaseButton.vue';

const apiBaseUrl = api.baseUrl;
const { isElectron } = useElectron();
const backendStatus = ref('не проверен');

const fieldOptions = [
  { key: 'title', label: 'Название объекта' },
  { key: 'type', label: 'Иконка типа' },
  { key: 'disk', label: 'Диск' },
  { key: 'createdDate', label: 'Дата создания' },
  { key: 'updatedDate', label: 'Дата редактирования' },
  { key: 'openedDate', label: 'Дата открытия' },
  { key: 'tags', label: 'Теги' },
];

async function checkBackend() {
  backendStatus.value = 'проверка…';
  try {
    await objectService.getAll();
    backendStatus.value = 'доступен';
  } catch (error) {
    backendStatus.value = `недоступен: ${error.message}`;
  }
}

onMounted(checkBackend);
</script>

<style scoped>
.settings {
  padding: var(--ls-space-5) var(--ls-space-6);
  max-width: 680px;
}

.settings h2 {
  margin: 0 0 var(--ls-space-5);
  font-family: var(--ls-font-display);
  font-size: 1.05rem;
  font-weight: 650;
}

.settings__block {
  padding: var(--ls-space-4) 0;
  border-top: 1px solid var(--ls-border-subtle);
}

.settings__block:last-of-type {
  border-bottom: 1px solid var(--ls-border-subtle);
}

.settings__block h3 {
  margin: 0 0 var(--ls-space-3);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ls-text-faint);
}

.settings__check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  color: var(--ls-text-muted);
  font-size: 0.85rem;
}

.settings__check input[type='checkbox'] {
  appearance: none;
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  margin: 0;
  border: 1px solid var(--ls-border);
  border-radius: 4px;
  background: var(--ls-bg);
  cursor: pointer;
  position: relative;
  transition: background var(--ls-transition), border-color var(--ls-transition);
  flex: 0 0 15px;
}

.settings__check input[type='checkbox']:checked {
  background: var(--ls-text);
  border-color: var(--ls-text);
}

.settings__check input[type='checkbox']:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid var(--ls-bg);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.settings__check input[type='checkbox']:hover {
  border-color: var(--ls-text-dim);
}

.settings__check--column {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.settings__select {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg);
  border-radius: var(--ls-radius-sm);
  padding: 7px 10px;
  color: var(--ls-text);
  font-size: 0.82rem;
  min-width: 220px;
  color-scheme: dark;
}

.settings__hint {
  margin: var(--ls-space-2) 0 0;
  color: var(--ls-text-dim);
  font-size: 0.76rem;
  line-height: 1.45;
}

.settings__list {
  margin: 0 0 var(--ls-space-3);
  display: grid;
  gap: 0;
}

.settings__list > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--ls-space-3);
  padding: 6px 0;
  border-top: 1px solid var(--ls-border-subtle);
}

.settings__list > div:first-child {
  border-top: none;
  padding-top: 2px;
}

.settings__list dt {
  font-size: 0.72rem;
  color: var(--ls-text-dim);
}

.settings__list dd {
  margin: 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.78rem;
  color: var(--ls-text-muted);
  text-align: right;
  word-break: break-all;
}
</style>
