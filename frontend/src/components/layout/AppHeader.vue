<template>
  <header class="header" :class="{ 'liquid-glass': uiStore.liquidGlass }">
    <div class="brand">
      <img class="brand__mark" :src="appIcon" alt="" draggable="false" />
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
import appIcon from '../../assets/app-icon.png';
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ls-space-4);
  padding: 0 var(--ls-space-4);
  background: var(--ls-bg);
  border-bottom: 1px solid var(--ls-border-subtle);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand__mark {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  object-fit: cover;
}

.brand__title {
  margin: 0;
  font-family: var(--ls-font-display);
  font-size: 0.88rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ls-text-muted);
}

.nav {
  display: flex;
  gap: var(--ls-space-2);
}

.nav__btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ls-text-muted);
  padding: 5px 12px;
  border-radius: var(--ls-radius-sm);
  font-size: 0.8rem;
  transition: color var(--ls-transition), background var(--ls-transition), border-color var(--ls-transition);
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
