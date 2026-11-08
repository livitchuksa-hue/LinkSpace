<template>
  <section class="graph-view">
    <div class="graph-view__top">
      <GraphToolbar @create-object="openCreateModal" />
    </div>

    <GraphCanvas
      :objects="graphStore.objects"
      :connections="graphStore.connections"
      :regions="graphStore.regions"
    >
      <div v-if="uiStore.welcomeVisible" class="welcome">
        <p class="welcome__eyebrow">Добро пожаловать</p>
        <h2 class="welcome__title">Linkspace</h2>
        <p class="welcome__text">
          Организуйте заметки, файлы, папки и ссылки в одном интерактивном графе.
        </p>
        <BaseButton variant="primary" @click="openCreateModal">
          Создать первый объект
        </BaseButton>
        <p v-if="statusMessage" class="welcome__status muted">{{ statusMessage }}</p>
      </div>
    </GraphCanvas>

    <BaseModal v-model="createOpen" title="Новый объект">
      <ObjectEditor @save="createObject" @cancel="createOpen = false" />
    </BaseModal>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import GraphToolbar from '../components/graph/GraphToolbar.vue';
import GraphCanvas from '../components/graph/GraphCanvas.vue';
import BaseButton from '../components/common/BaseButton.vue';
import BaseModal from '../components/common/BaseModal.vue';
import ObjectEditor from '../components/objects/ObjectEditor.vue';
import { graphStore, useGraphStore } from '../stores/graphStore';
import { uiStore } from '../stores/uiStore';
import { objectService } from '../services/objectService';
import { useGraph } from '../composables/useGraph';

const createOpen = ref(false);
const statusMessage = ref('');
const { addObject } = useGraphStore();
const { loadGraph } = useGraph();

function openCreateModal() {
  createOpen.value = true;
}

async function createObject(payload) {
  try {
    const created = await objectService.create(payload);
    addObject(created);
    uiStore.selectedObjectId = created.id;
    uiStore.welcomeVisible = false;
    createOpen.value = false;
    statusMessage.value = '';
  } catch (error) {
    // Локальная заготовка, если backend ещё не запущен
    const localObject = {
      id: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addObject(localObject);
    uiStore.selectedObjectId = localObject.id;
    uiStore.welcomeVisible = false;
    createOpen.value = false;
    statusMessage.value = `Объект создан локально (${error.message}). Запустите backend для сохранения в SQLite.`;
  }
}

onMounted(async () => {
  await loadGraph();
  if (graphStore.objects.length > 0) {
    uiStore.welcomeVisible = false;
  } else if (graphStore.error) {
    statusMessage.value = 'Backend пока недоступен — можно работать с локальной заготовкой.';
  }
});
</script>

<style scoped>
.graph-view {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.graph-view__top {
  padding: var(--ls-space-4) var(--ls-space-5) 0;
}

.welcome {
  width: min(420px, calc(100% - 48px));
  text-align: center;
  padding: var(--ls-space-6);
  border: 1px solid var(--ls-border);
  border-radius: var(--ls-radius-lg);
  background: rgba(18, 22, 30, 0.88);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.welcome__eyebrow {
  margin: 0 0 var(--ls-space-2);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ls-accent);
}

.welcome__title {
  margin: 0 0 var(--ls-space-3);
  font-family: var(--ls-font-display);
  font-size: 2rem;
  letter-spacing: 0.02em;
}

.welcome__text {
  margin: 0 0 var(--ls-space-5);
  color: var(--ls-text-muted);
  font-size: 0.95rem;
}

.welcome__status {
  margin: var(--ls-space-4) 0 0;
  font-size: 0.8rem;
}
</style>
