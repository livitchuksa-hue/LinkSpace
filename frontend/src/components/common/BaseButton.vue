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
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
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
  background: #e8e8e8;
}

.base-btn--ghost {
  background: transparent;
  border-color: #2c2c2c;
  color: var(--ls-text);
}

.base-btn--ghost:hover:not(:disabled) {
  background: #161616;
}

.base-btn--active {
  background: #fff;
  color: #111;
}
</style>
