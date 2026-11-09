<template>
  <Teleport to="body">
    <div v-if="modelValue" ref="root" class="modal" role="dialog" aria-modal="true">
      <div class="modal__backdrop" @click="close"></div>
      <div class="modal__panel" :style="panelWidth ? { width: panelWidth } : {}">
        <header class="modal__header">
          <h3>{{ title }}</h3>
          <button class="modal__close" type="button" aria-label="Закрыть" @click="close">×</button>
        </header>
        <div class="modal__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  panelWidth: { type: String, default: null },
});

const emit = defineEmits(['update:modelValue']);
const root = ref(null);

function close() {
  emit('update:modelValue', false);
}

function onKeydown(event) {
  if (event.key !== 'Escape' || !props.modelValue) return;
  const modals = document.querySelectorAll('.modal');
  const top = modals[modals.length - 1];
  if (top && root.value && top.contains(root.value)) {
    close();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(5, 7, 12, 0.65);
}

.modal__panel {
  position: relative;
  width: min(520px, calc(100% - 32px));
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-lg);
  padding: var(--ls-space-4);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ls-space-3);
}

.modal__header h3 {
  margin: 0;
  font-size: 1rem;
}

.modal__close {
  border: none;
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 1.4rem;
  line-height: 1;
}

.modal__body {
  overflow: auto;
  min-height: 0;
}

.modal__footer {
  margin-top: var(--ls-space-4);
  display: flex;
  justify-content: flex-end;
  gap: var(--ls-space-2);
}
</style>
