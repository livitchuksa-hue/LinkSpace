<template>
  <div
    v-if="menu"
    ref="root"
    class="ctx"
    :class="{ 'liquid-glass': uiStore.liquidGlass }"
    :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
    @contextmenu.stop.prevent
    @pointerdown.stop
  >
    <template v-for="(item, index) in items" :key="item.action || `sep-${index}`">
      <div v-if="item.separator" class="ctx__sep" aria-hidden="true"></div>
      <button
        v-else
        class="ctx__item"
        :class="{ 'ctx__item--checked': item.checked }"
        type="button"
        @click="choose(item)"
      >
        <span class="ctx__check" aria-hidden="true">{{ item.checked ? '✓' : '' }}</span>
        {{ item.label }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { cardFieldChecked, toggleCardField } from '../../utils/cardFields';
import { uiStore } from '../../stores/uiStore';

const props = defineProps({
  menu: { type: Object, default: null },
});

const emit = defineEmits(['action', 'close']);

const root = ref(null);

const FIELD_ITEMS = [
  { key: 'title', label: 'Название' },
  { key: 'type', label: 'Тип' },
  { key: 'disk', label: 'Диск' },
  { key: 'dates', label: 'Даты' },
  { key: 'tags', label: 'Теги' },
];

const items = computed(() => {
  if (!props.menu) return [];
  const kind = props.menu.kind;
  const id = props.menu.id;
  const result = [];

  if (kind === 'canvas') {
    result.push(
      { action: 'create', createType: 'NOTE', label: 'Новая заметка' },
      { action: 'create', createType: 'FILE', label: 'Новый файл' },
      { action: 'create', createType: 'FOLDER', label: 'Новая папка' },
      { action: 'create', createType: 'LINK', label: 'Новая ссылка' },
    );
    return result;
  }

  if (kind === 'object') {
    result.push({ action: 'open', label: 'Открыть' });
    result.push({ action: 'edit', label: 'Редактировать' });
    result.push({ action: 'connect', label: 'Связать' });
    result.push({ separator: true });
    for (const field of FIELD_ITEMS) {
      result.push({
        action: 'field',
        field: field.key,
        label: field.label,
        checked: cardFieldChecked(id, field.key),
      });
    }
    result.push({ separator: true });
  } else {
    result.push({ action: 'edit', label: 'Редактировать' });
    result.push({ separator: true });
  }
  result.push(
    { action: 'forward', label: 'Вперёд' },
    { action: 'backward', label: 'Назад' },
    { action: 'front', label: 'На передний план' },
    { action: 'back', label: 'На задний план' },
  );
  return result;
});

function choose(item) {
  if (item.action === 'field' && props.menu.kind === 'object') {
    toggleCardField(props.menu.id, item.field);
    emit('close');
    return;
  }
  emit('action', {
    action: item.action,
    kind: props.menu.kind,
    id: props.menu.id,
    createType: item.createType,
    point: props.menu.point,
  });
  emit('close');
}

function onWindowPointerDown(event) {
  if (root.value && !root.value.contains(event.target)) {
    emit('close');
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('close');
}

watch(() => props.menu, (menu) => {
  if (menu) {
    window.addEventListener('pointerdown', onWindowPointerDown, true);
    window.addEventListener('keydown', onKeydown);
  } else {
    window.removeEventListener('pointerdown', onWindowPointerDown, true);
    window.removeEventListener('keydown', onKeydown);
  }
});

onMounted(() => {
  if (props.menu) {
    window.addEventListener('pointerdown', onWindowPointerDown, true);
    window.addEventListener('keydown', onKeydown);
  }
});

onUnmounted(() => {
  window.removeEventListener('pointerdown', onWindowPointerDown, true);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.ctx {
  position: fixed;
  z-index: 2000;
  min-width: 190px;
  padding: 6px;
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-md);
  box-shadow: var(--ls-shadow-lg);
}

.ctx__item {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--ls-text-muted);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background var(--ls-transition), color var(--ls-transition);
}

.ctx__item:hover {
  background: var(--ls-bg-soft);
  color: var(--ls-text);
}

.ctx__check {
  display: inline-block;
  width: 14px;
  flex: 0 0 14px;
  text-align: center;
  color: var(--ls-text);
}

.ctx__item--checked {
  color: var(--ls-text);
}

.ctx__sep {
  height: 1px;
  margin: 5px 8px;
  background: var(--ls-border-subtle);
}
</style>
