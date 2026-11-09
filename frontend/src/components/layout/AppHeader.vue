<template>
  <header class="header">
    <div class="brand">
      <span class="brand__mark" aria-hidden="true"></span>
      <h1 class="brand__title">Linkspace</h1>
    </div>
    <nav class="nav">
      <button
        class="nav__btn"
        :class="{ 'nav__btn--active': uiStore.settingsOpen }"
        type="button"
        @click="uiStore.settingsOpen = !uiStore.settingsOpen"
      >
        Настройки
      </button>
    </nav>
  </header>
</template>

<script setup>
import { uiStore } from '../../stores/uiStore';
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ls-space-4);
  padding: 0 var(--ls-space-5);
  background: #0b0b0b;
  border-bottom: 1px solid var(--ls-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--ls-space-3);
}

.brand__mark {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: #fff;
}

.brand__title {
  margin: 0;
  font-family: var(--ls-font-display);
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.nav {
  display: flex;
  gap: var(--ls-space-2);
}

.nav__btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ls-text-muted);
  padding: 6px 12px;
  border-radius: var(--ls-radius-sm);
}

.nav__btn:hover {
  color: var(--ls-text);
  background: var(--ls-bg-soft);
}

.nav__btn--active {
  color: var(--ls-text);
  border-color: var(--ls-border);
}
</style>
