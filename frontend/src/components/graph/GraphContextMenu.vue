<template>
  <div
    v-if="menu"
    ref="root"
    class="ctx"
    :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
    @contextmenu.prevent
    @pointerdown.stop
  >
    <template v-for="(item, index) in items" :key="item.action || `sep-${index}`">
      <div v-if="item.separator" class="ctx__sep" aria-hidden="true"></div>
      <button
        v-else
        class="ctx__item"
        type="button"
        @click="choose(item)"
      >
        {{ item.label }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  menu: { type: Object, default: null },
});

const emit = defineEmits(['action', 'close']);

const root = ref(null);

const items = computed(() => {
  if (!props.menu) return [];
  const kind = props.menu.kind;
  const result = [];
  if (kind === 'object') {
    result.push({ action: 'open', label: 'Открыть' });
  }
  result.push({ action: 'edit', label: 'Редактировать' });
  if (kind === 'object') {
    result.push({ action: 'connect', label: 'Связать' });
  }
  result.push({ separator: true });
  result.push(
    { action: 'forward', label: 'Вперёд' },
    { action: 'backward', label: 'Назад' },
    { action: 'front', label: 'На передний план' },
    { action: 'back', label: 'На задний план' },
  );
  return result;
});

function choose(item) {
  emit('action', { action: item.action, kind: props.menu.kind, id: props.menu.id });
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
  padding: 4px;
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-sm);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.ctx__item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--ls-text);
  padding: 7px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.ctx__item:hover {
  background: var(--ls-bg-soft);
}

.ctx__sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--ls-border);
}
</style>
