<template>
  <button
    class="base-btn"
    :class="[`base-btn--${variant}`, { 'base-btn--block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
</script>

<style scoped>
.base-btn {
  border: 1px solid transparent;
  border-radius: var(--ls-radius-sm);
  padding: 6px 12px;
  min-height: var(--ls-control-h);
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  transition: background var(--ls-transition), border-color var(--ls-transition), opacity var(--ls-transition);
}

.base-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.base-btn--block {
  width: 100%;
}

.base-btn--primary {
  background: #fff;
  color: #111;
}

.base-btn--primary:hover:not(:disabled) {
  background: #e0e0e0;
}

.base-btn--ghost {
  background: transparent;
  border-color: var(--ls-border);
  color: var(--ls-text);
}

.base-btn--ghost:hover:not(:disabled) {
  background: var(--ls-bg-soft);
  border-color: #3d3d3d;
}

.base-btn--danger {
  background: transparent;
  border-color: var(--ls-danger-border);
  color: var(--ls-danger);
}

.base-btn--danger:hover:not(:disabled) {
  background: var(--ls-danger-soft);
  border-color: var(--ls-danger);
}

.base-btn--active {
  background: #fff;
  color: #111;
}
</style>
