<template>
  <aside class="panel panel--right inspector">
    <h2 class="inspector__title">Свойства</h2>

    <template v-if="selectedObject">
      <ObjectDetails :object="selectedObject" />
      <div class="inspector__actions">
        <BaseButton v-if="canOpen" variant="primary" @click="openSelected">Открыть</BaseButton>
        <BaseButton variant="ghost" @click="editingObject = { ...selectedObject }">Редактировать</BaseButton>
        <BaseButton variant="ghost" @click="confirmDeleteObject = true">Удалить</BaseButton>
      </div>
    </template>

    <template v-else-if="selectedConnection">
      <p class="inspector__title">Связь</p>
      <dl class="inspector__meta">
        <div>
          <dt>От</dt>
          <dd>{{ endpointTitle(selectedConnection.sourceId) }}</dd>
        </div>
        <div>
          <dt>К</dt>
          <dd>{{ endpointTitle(selectedConnection.targetId) }}</dd>
        </div>
      </dl>
      <label class="inspector__field">
        <span>Название связи</span>
        <input v-model="connectionLabel" type="text" maxlength="120" placeholder="Необязательно" />
      </label>
      <div class="inspector__field">
        <span>Цвет связи</span>
        <div class="inspector__color-row">
          <input
            type="color"
            :value="connectionColor || '#8f8f8f'"
            @input="connectionColor = $event.target.value"
          />
          <input v-model="connectionColor" type="text" maxlength="7" placeholder="#8f8f8f" />
        </div>
      </div>
      <div class="inspector__actions">
        <BaseButton variant="primary" @click="saveConnection">Сохранить</BaseButton>
        <BaseButton variant="ghost" @click="confirmDeleteConnection = true">Удалить</BaseButton>
      </div>
    </template>

    <template v-else-if="selectedRegion">
      <p class="inspector__title">Область</p>
      <dl class="inspector__meta">
        <div>
          <dt>Название</dt>
          <dd>{{ selectedRegion.name }}</dd>
        </div>
        <div>
          <dt>Заливка</dt>
          <dd class="inspector__color"><span :style="{ background: selectedRegion.color || '#d9d9d9' }"></span>{{ selectedRegion.color || 'по умолчанию' }}</dd>
        </div>
      </dl>
      <p class="muted inspector__hint">Область — визуальная группировка: её можно перемещать по графу.</p>
      <div class="inspector__actions">
        <BaseButton variant="ghost" @click="editingRegion = { ...selectedRegion }">Редактировать</BaseButton>
        <BaseButton variant="ghost" @click="confirmDeleteRegion = true">Удалить</BaseButton>
      </div>
    </template>

    <div v-else class="inspector__empty">
      <p class="muted">Объект не выбран</p>
      <p class="dim">
        Выберите узел, связь или область на графе, чтобы увидеть свойства.
      </p>
    </div>

    <BaseModal
      :model-value="Boolean(editingObject)"
      title="Редактировать объект"
      @update:model-value="(value) => { if (!value) editingObject = null; }"
    >
      <ObjectEditor
        v-if="editingObject"
        :object="editingObject"
        @save="saveObjectEdit"
        @cancel="editingObject = null"
      />
    </BaseModal>

    <BaseModal
      :model-value="Boolean(editingRegion)"
      title="Редактировать область"
      @update:model-value="(value) => { if (!value) editingRegion = null; }"
    >
      <RegionEditor
        v-if="editingRegion"
        :region="editingRegion"
        @save="saveRegionEdit"
        @cancel="editingRegion = null"
      />
    </BaseModal>

    <ConfirmDialog
      v-model="confirmDeleteObject"
      title="Удалить объект"
      message="Объект и все его связи будут удалены. Продолжить?"
      @confirm="deleteSelectedObject"
    />
    <ConfirmDialog
      v-model="confirmDeleteConnection"
      title="Удалить связь"
      message="Связь между узлами будет удалена. Продолжить?"
      @confirm="deleteSelectedConnection"
    />
    <ConfirmDialog
      v-model="confirmDeleteRegion"
      title="Удалить область"
      message="Визуальная область будет удалена. Узлы останутся на графе. Продолжить?"
      @confirm="deleteSelectedRegion"
    />
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import ObjectDetails from '../objects/ObjectDetails.vue';
import ObjectEditor from '../objects/ObjectEditor.vue';
import RegionEditor from '../objects/RegionEditor.vue';
import BaseButton from '../common/BaseButton.vue';
import BaseModal from '../common/BaseModal.vue';
import ConfirmDialog from '../common/ConfirmDialog.vue';
import { uiStore } from '../../stores/uiStore';
import { graphStore } from '../../stores/graphStore';
import { useGraph } from '../../composables/useGraph';
import { useElectron } from '../../composables/useElectron';

const {
  updateObject,
  markOpened,
  deleteObject,
  updateConnection,
  deleteConnection,
  updateRegion,
  deleteRegion,
} = useGraph();
const { openPath, openUrl } = useElectron();

const editingObject = ref(null);
const editingRegion = ref(null);
const connectionLabel = ref('');
const connectionColor = ref('');
const confirmDeleteObject = ref(false);
const confirmDeleteConnection = ref(false);
const confirmDeleteRegion = ref(false);

const selectedObject = computed(() =>
  graphStore.objects.find((item) => item.id === uiStore.selectedObjectId) || null,
);
const selectedConnection = computed(() =>
  graphStore.connections.find((item) => item.id === uiStore.selectedConnectionId) || null,
);
const selectedRegion = computed(() =>
  graphStore.regions.find((item) => item.id === uiStore.selectedRegionId) || null,
);
const canOpen = computed(() => {
  if (!selectedObject.value) return false;
  const type = selectedObject.value.type;
  return (type === 'FILE' || type === 'FOLDER') && selectedObject.value.path
    || type === 'LINK' && selectedObject.value.url;
});

watch(selectedConnection, (connection) => {
  connectionLabel.value = connection?.label || '';
  connectionColor.value = connection?.color || '';
});

watch(() => uiStore.pendingEdit, (request) => {
  if (!request) return;
  uiStore.pendingEdit = null;
  if (request.kind === 'object') {
    const object = graphStore.objects.find((item) => item.id === request.id);
    if (object) editingObject.value = { ...object };
  } else if (request.kind === 'region') {
    const region = graphStore.regions.find((item) => item.id === request.id);
    if (region) editingRegion.value = { ...region };
  }
});

function endpointTitle(id) {
  return graphStore.objects.find((item) => item.id === id)?.title || `#${id}`;
}

async function openSelected() {
  const object = selectedObject.value;
  if (!object) return;
  try {
    await markOpened(object.id);
    if (object.type === 'LINK') {
      await openUrl(object.url);
    } else {
      const result = await openPath(object.path);
      if (!result.ok) {
        uiStore.setStatus(result.error || 'Не удалось открыть путь');
      }
    }
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось открыть объект');
  }
}

async function saveObjectEdit(payload) {
  try {
    await updateObject(editingObject.value.id, { ...editingObject.value, ...payload });
    editingObject.value = null;
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось сохранить объект');
  }
}

async function deleteSelectedObject() {
  if (!selectedObject.value) return;
  try {
    await deleteObject(selectedObject.value.id);
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось удалить объект');
  }
}

async function saveConnection() {
  if (!selectedConnection.value) return;
  try {
    await updateConnection(selectedConnection.value.id, {
      sourceId: selectedConnection.value.sourceId,
      targetId: selectedConnection.value.targetId,
      label: connectionLabel.value,
      color: connectionColor.value || null,
    });
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось сохранить связь');
  }
}

async function deleteSelectedConnection() {
  if (!selectedConnection.value) return;
  try {
    await deleteConnection(selectedConnection.value.id);
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось удалить связь');
  }
}

async function saveRegionEdit(payload) {
  if (!editingRegion.value) return;
  try {
    await updateRegion(editingRegion.value.id, {
      name: payload.name,
      color: payload.color,
      shape: payload.shape || 'polygon',
      coordinates: payload.coordinates,
    });
    editingRegion.value = null;
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось сохранить область');
  }
}

async function deleteSelectedRegion() {
  if (!selectedRegion.value) return;
  try {
    await deleteRegion(selectedRegion.value.id);
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось удалить область');
  }
}
</script>

<style scoped>
.inspector {
  padding: var(--ls-space-5) var(--ls-space-4);
}

.inspector__title {
  margin: 0 0 var(--ls-space-4);
  font-size: 0.95rem;
  font-weight: 600;
}

.inspector__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ls-space-2);
  margin-top: var(--ls-space-4);
}

.inspector__meta {
  margin: 0 0 var(--ls-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-3);
}

.inspector__meta dt {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ls-text-dim);
}

.inspector__meta dd {
  margin: 2px 0 0;
  font-size: 0.88rem;
  word-break: break-word;
}

.inspector__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--ls-text-muted);
}

.inspector__field input {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg);
  border-radius: var(--ls-radius-sm);
  padding: 8px 10px;
  color: var(--ls-text);
}

.inspector__color-row {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 8px;
  align-items: center;
}

.inspector__color-row input[type='color'] {
  width: 44px;
  height: 34px;
  padding: 2px;
  cursor: pointer;
}

.inspector__color {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inspector__color span {
  width: 18px;
  height: 18px;
  border: 1px solid #4a4a4a;
  border-radius: 5px;
}

.inspector__hint {
  font-size: 0.8rem;
  line-height: 1.4;
}

.inspector__empty {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-2);
}

.inspector__empty p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
