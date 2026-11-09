<template>
  <div class="fp" :class="[`fp--${side}`, { 'fp--visible': visible }]">
    <div class="fp__hotzone" aria-hidden="true" @mouseenter="revealed = true"></div>
    <aside class="fp__panel" @mouseleave="onPanelLeave">
      <div class="fp__pinbar">
        <button
          class="fp__pin"
          :class="{ 'fp__pin--active': pinned }"
          type="button"
          :title="pinned ? 'Открепить панель' : 'Закрепить панель'"
          @click="$emit('update:pinned', !pinned)"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9.5 2.5 13.5 6.5" />
            <path d="M11 4l-6.5 6.5a1.5 1.5 0 0 0 2 2L13 6" />
            <path d="M4.5 9.5 3 13l3.5-1.5" />
          </svg>
        </button>
      </div>
      <div class="fp__content">
        <slot />
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { uiStore } from '../../stores/uiStore';

const props = defineProps({
  side: { type: String, default: 'left' },
  pinned: { type: Boolean, default: false },
  reveal: { type: Boolean, default: false },
});

defineEmits(['update:pinned']);

const revealed = ref(false);
const visible = computed(() => props.pinned || props.reveal || revealed.value);

const openFlag = computed(() => (props.side === 'left' ? 'leftPanelOpen' : 'rightPanelOpen'));

watch(visible, (value) => {
  uiStore[openFlag.value] = value;
}, { immediate: true });

onMounted(() => {
  uiStore[openFlag.value] = visible.value;
});

function onPanelLeave() {
  if (!props.pinned) revealed.value = false;
}
</script>

<style scoped>
.fp {
  position: fixed;
  top: var(--ls-header-height);
  bottom: 0;
  z-index: 60;
  display: flex;
  pointer-events: none;
}

.fp--left {
  left: 0;
}

.fp--right {
  right: 0;
  flex-direction: row-reverse;
}

.fp__hotzone {
  width: 12px;
  flex: 0 0 12px;
  pointer-events: auto;
}

.fp__panel {
  width: var(--ls-sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--ls-bg-panel);
  border-right: 1px solid var(--ls-border);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  pointer-events: auto;
  transition: transform 0.22s ease;
}

.fp--left .fp__panel {
  transform: translateX(calc(-100% - 12px));
}

.fp--right .fp__panel {
  border-right: none;
  border-left: 1px solid var(--ls-border);
  transform: translateX(calc(100% + 12px));
}

.fp--visible .fp__panel {
  transform: translateX(0);
}

.fp__pinbar {
  display: flex;
  align-items: center;
  height: 34px;
  flex: 0 0 34px;
  padding: 0 8px;
  border-bottom: 1px solid var(--ls-border-subtle);
}

.fp--right .fp__pinbar {
  justify-content: flex-end;
}

.fp__pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: var(--ls-radius-sm);
  background: transparent;
  color: var(--ls-text-dim);
  cursor: pointer;
}

.fp__pin:hover {
  color: var(--ls-text);
  background: var(--ls-bg-soft);
}

.fp__pin--active {
  color: var(--ls-text);
  border-color: var(--ls-border);
}

.fp__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.fp__content :deep(.panel) {
  border: none;
  height: 100%;
}
</style>
