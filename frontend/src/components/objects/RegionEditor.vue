<template>
  <form class="region-editor" @submit.prevent="submit">
    <label class="region-editor__field">
      <span>Название области</span>
      <input v-model="form.name" type="text" required maxlength="120" placeholder="Например, Биология" />
    </label>

    <div class="region-editor__field">
      <span>Цвет области</span>
      <div class="region-editor__color-row">
        <input
          class="region-editor__picker"
          type="color"
          :value="pickerColor"
          aria-label="Выбрать цвет"
          @input="onPickerInput"
        />
        <input
          v-model="form.color"
          type="text"
          maxlength="7"
          placeholder="#3b82f6"
          spellcheck="false"
        />
      </div>
      <p class="region-editor__hint">Интерфейс остаётся монохромным, цвет используется только для самой области.</p>
    </div>

    <label class="region-editor__field">
      <span>Форма области</span>
      <select v-model="form.shape">
        <option value="polygon">Произвольный контур</option>
        <option value="rectangle">Прямоугольник</option>
        <option value="ellipse">Эллипс</option>
      </select>
    </label>

    <div v-if="form.shape === 'polygon'" class="region-editor__field">
      <span>Точки контура ({{ form.points.length }})</span>
      <div class="region-editor__points">
        <div v-for="(point, index) in form.points" :key="index" class="region-editor__point">
          <span class="region-editor__point-index">{{ index + 1 }}</span>
          <input v-model.number="point.x" type="number" step="0.01" placeholder="X" />
          <input v-model.number="point.y" type="number" step="0.01" placeholder="Y" />
          <button
            class="region-editor__point-remove"
            type="button"
            :disabled="form.points.length <= 3"
            title="Удалить точку"
            @click="removePoint(index)"
          >
            ×
          </button>
        </div>
      </div>
      <BaseButton variant="ghost" type="button" @click="addPoint">Добавить точку</BaseButton>
      <p class="region-editor__hint">Минимум 3 точки. Также точки можно двигать прямо на графе: выделите область — появятся маркеры вершин и середин рёбер.</p>
    </div>

    <p class="region-editor__hint">Область визуально группирует узлы; при перетаскивании узлы внутри перемещаются вместе с ней.</p>
    <p v-if="error" class="region-editor__error">{{ error }}</p>

    <div class="region-editor__actions">
      <BaseButton variant="ghost" type="button" @click="$emit('cancel')">Отмена</BaseButton>
      <BaseButton variant="primary" type="submit">Сохранить</BaseButton>
    </div>
  </form>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import BaseButton from '../common/BaseButton.vue';

const DEFAULT_COLOR = '#3b82f6';

const props = defineProps({
  region: { type: Object, default: null },
});

const emit = defineEmits(['save', 'cancel']);

function parsePoints(coordinates) {
  if (!coordinates) return [];
  try {
    const parsed = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((point) => ({ x: Number(point?.x) || 0, y: Number(point?.y) || 0 }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  } catch {
    return [];
  }
}

const form = reactive({
  name: props.region?.name || '',
  color: props.region?.color || DEFAULT_COLOR,
  shape: ['polygon', 'rectangle', 'ellipse'].includes(props.region?.shape) ? props.region.shape : 'polygon',
  points: parsePoints(props.region?.coordinates),
});

function polygonCenter() {
  if (!form.points.length) return { x: 0, y: 0 };
  const sum = form.points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / form.points.length, y: sum.y / form.points.length };
}

function addPoint() {
  const center = polygonCenter();
  form.points.push({
    x: Math.round((center.x + 60) * 100) / 100,
    y: Math.round((center.y + 60) * 100) / 100,
  });
}

function removePoint(index) {
  if (form.points.length <= 3) return;
  form.points.splice(index, 1);
}

const error = ref(null);

function normalizeColor(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  const short = /^#([0-9a-f]{3})$/.exec(trimmed);
  if (short) {
    return `#${short[1].split('').map((char) => char + char).join('')}`;
  }
  return /^#[0-9a-f]{6}$/.test(trimmed) ? trimmed : null;
}

const pickerColor = computed(() => normalizeColor(form.color) || DEFAULT_COLOR);

function onPickerInput(event) {
  form.color = event.target.value.toLowerCase();
}

function submit() {
  error.value = null;
  if (!form.name.trim()) {
    error.value = 'Введите название области.';
    return;
  }

  const color = normalizeColor(form.color);
  if (!color) {
    error.value = 'Цвет должен быть в формате #rrggbb.';
    return;
  }

  let coordinates = props.region?.coordinates ?? null;
  if (form.shape === 'polygon') {
    if (form.points.length < 3) {
      error.value = 'Для произвольного контура нужно минимум 3 точки.';
      return;
    }
    if (form.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      error.value = 'Все координаты точек должны быть числами.';
      return;
    }
    coordinates = JSON.stringify(form.points.map((point) => ({
      x: Math.round(point.x * 100) / 100,
      y: Math.round(point.y * 100) / 100,
    })));
  }

  emit('save', {
    name: form.name.trim(),
    color,
    coordinates,
    shape: form.shape,
  });
}
</script>

<style scoped>
.region-editor {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-3);
}

.region-editor__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--ls-text-muted);
}

.region-editor__field input[type='text'],
.region-editor__field input[type='number'],
.region-editor__field select {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg);
  border-radius: var(--ls-radius-sm);
  padding: 8px 10px;
  color: var(--ls-text);
}

.region-editor__points {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow: auto;
}

.region-editor__point {
  display: grid;
  grid-template-columns: 28px 1fr 1fr 28px;
  gap: 6px;
  align-items: center;
}

.region-editor__point-index {
  color: var(--ls-text-dim);
  font-size: 0.75rem;
  text-align: center;
}

.region-editor__point input {
  width: 100%;
  min-width: 0;
}

.region-editor__point-remove {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg);
  color: var(--ls-text-muted);
  border-radius: var(--ls-radius-sm);
  cursor: pointer;
  line-height: 1;
}

.region-editor__point-remove:disabled {
  opacity: 0.4;
  cursor: default;
}

.region-editor__color-row {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 8px;
  align-items: center;
}

.region-editor__picker {
  width: 54px;
  height: 40px;
  padding: 4px;
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-sm);
  background: var(--ls-bg);
  cursor: pointer;
}

.region-editor__hint {
  margin: 0;
  color: var(--ls-text-dim);
  font-size: 0.78rem;
}

.region-editor__error {
  margin: 0;
  color: var(--ls-danger);
  font-size: 0.85rem;
}

.region-editor__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ls-space-2);
  margin-top: var(--ls-space-2);
}
</style>
