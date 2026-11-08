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
  border-radius: var(--ls-radius-md);
  padding: 10px 16px;
  font-weight: 600;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.base-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.base-btn--block {
  width: 100%;
}

.base-btn--primary {
  background: var(--ls-accent);
  color: #fff;
}

.base-btn--primary:hover:not(:disabled) {
  background: var(--ls-accent-hover);
}

.base-btn--ghost {
  background: transparent;
  border-color: var(--ls-border);
  color: var(--ls-text);
}

.base-btn--ghost:hover:not(:disabled) {
  background: var(--ls-bg-soft);
}
</style>
