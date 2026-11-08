<template>
  <header class="header">
    <div class="brand">
      <span class="brand__mark" aria-hidden="true"></span>
      <h1 class="brand__title">Linkspace</h1>
    </div>
    <nav class="nav">
      <button
        class="nav__btn"
        :class="{ 'nav__btn--active': uiStore.currentView === 'graph' }"
        type="button"
        @click="setView('graph')"
      >
        Граф
      </button>
      <button
        class="nav__btn"
        :class="{ 'nav__btn--active': uiStore.currentView === 'settings' }"
        type="button"
        @click="setView('settings')"
      >
        Настройки
      </button>
    </nav>
  </header>
</template>

<script setup>
import { uiStore, useUiStore } from '../../stores/uiStore';

const { setView } = useUiStore();
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ls-space-4);
  padding: 0 var(--ls-space-5);
  background: rgba(18, 22, 30, 0.92);
  border-bottom: 1px solid var(--ls-border-subtle);
  backdrop-filter: blur(8px);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--ls-space-3);
}

.brand__mark {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(135deg, var(--ls-accent), #7a5cff);
  box-shadow: 0 0 0 4px var(--ls-accent-soft);
}

.brand__title {
  margin: 0;
  font-family: var(--ls-font-display);
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: 0.02em;
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
  background: var(--ls-bg-soft);
}
</style>
