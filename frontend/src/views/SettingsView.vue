<template>
  <section class="settings">
    <h2>Настройки</h2>
    <p class="muted">
      Базовые параметры приложения появятся здесь позже.
      Сейчас доступен адрес REST API из переменной окружения.
    </p>
    <dl class="settings__list">
      <div>
        <dt>API</dt>
        <dd>{{ apiBaseUrl }}</dd>
      </div>
      <div>
        <dt>Electron</dt>
        <dd>{{ isElectron ? 'активен' : 'браузерный режим Vite' }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { api } from '../services/api';
import { useElectron } from '../composables/useElectron';

const apiBaseUrl = api.baseUrl;
const { isElectron } = useElectron();
</script>

<style scoped>
.settings {
  padding: var(--ls-space-6);
  max-width: 640px;
}

.settings h2 {
  margin: 0 0 var(--ls-space-3);
}

.settings p {
  margin: 0 0 var(--ls-space-5);
}

.settings__list {
  margin: 0;
  display: grid;
  gap: var(--ls-space-4);
}

.settings__list dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ls-text-dim);
}

.settings__list dd {
  margin: 4px 0 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.9rem;
}
</style>
