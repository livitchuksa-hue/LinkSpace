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
  padding: var(--ls-space-6);
  max-width: 720px;
}

.settings h2 {
  margin: 0 0 var(--ls-space-5);
}

.settings__block {
  margin-bottom: var(--ls-space-6);
}

.settings__block h3 {
  margin: 0 0 var(--ls-space-3);
  font-size: 0.95rem;
}

.settings__check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  color: var(--ls-text-muted);
  font-size: 0.9rem;
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
  padding: 8px 10px;
  color: var(--ls-text);
  min-width: 220px;
}

.settings__hint {
  margin: var(--ls-space-3) 0 0;
  color: var(--ls-text-dim);
  font-size: 0.8rem;
}

.settings__list {
  margin: 0 0 var(--ls-space-3);
  display: grid;
  gap: var(--ls-space-4);
}

.settings__list dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ls-text-dim);
}

.settings__list dd {
  margin: 4px 0 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.9rem;
}
</style>
