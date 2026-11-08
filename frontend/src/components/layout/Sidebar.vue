<template>
  <aside class="panel sidebar">
    <div class="sidebar__section">
      <p class="sidebar__label">Рабочее пространство</p>
      <ul class="sidebar__list">
        <li>
          <button class="sidebar__item sidebar__item--active" type="button">
            Основной граф
          </button>
        </li>
      </ul>
    </div>

    <div class="sidebar__section">
      <p class="sidebar__label">Типы объектов</p>
      <ul class="sidebar__list">
        <li><span class="sidebar__chip">Заметки</span></li>
        <li><span class="sidebar__chip">Файлы</span></li>
        <li><span class="sidebar__chip">Папки</span></li>
        <li><span class="sidebar__chip">Ссылки</span></li>
      </ul>
    </div>

    <p class="sidebar__hint dim">
      Боковая панель будет показывать фильтры и списки узлов.
    </p>
  </aside>
</template>

<script setup>
/* Навигация и фильтры графа — заготовка каркаса. */
</script>

<style scoped>
.sidebar {
  padding: var(--ls-space-5) var(--ls-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-5);
}

.sidebar__label {
  margin: 0 0 var(--ls-space-3);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ls-text-dim);
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-2);
}

.sidebar__item {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ls-text-muted);
  padding: 8px 10px;
  border-radius: var(--ls-radius-sm);
}

.sidebar__item--active,
.sidebar__item:hover {
  color: var(--ls-text);
  background: var(--ls-bg-soft);
  border-color: var(--ls-border);
}

.sidebar__chip {
  display: inline-block;
  color: var(--ls-text-muted);
  font-size: 0.9rem;
  padding: 4px 0;
}

.sidebar__hint {
  margin-top: auto;
  font-size: 0.82rem;
  line-height: 1.45;
}
</style>
