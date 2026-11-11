<template>
  <aside class="panel panel--right inspector">
    <h2 class="inspector__title">Свойства</h2>

    <template v-if="multiCount > 1">
      <p class="inspector__title">Выбрано объектов: {{ multiCount }}</p>
      <p class="muted inspector__hint">
        Объекты можно перемещать и изменять размер вместе. Кликните по объекту
        без Ctrl, чтобы выбрать его отдельно.
      </p>

      <div class="inspector__fields">
        <p class="inspector__group">Тег для всех</p>
        <div class="inspector__tag-row">
          <input
            v-model="multiTagName"
            type="text"
            maxlength="40"
            placeholder="Название тега"
            @keyup.enter="applyMultiTag"
          />
          <BaseButton variant="ghost" @click="applyMultiTag">Добавить</BaseButton>
        </div>
      </div>

      <div class="inspector__fields">
        <p class="inspector__group">Связи</p>
        <div class="inspector__actions inspector__actions--tight">
          <BaseButton variant="ghost" @click="connectSelectedPairs">Все между собой</BaseButton>
          <BaseButton variant="ghost" @click="connectSelectedChain">По очереди выбора</BaseButton>
        </div>
      </div>

      <div class="inspector__actions">
        <BaseButton variant="danger" @click="confirmDeleteObject = true">Удалить все</BaseButton>
      </div>
    </template>

    <template v-else-if="selectedObject">
      <ObjectDetails :object="selectedObject" />
      <div class="inspector__fields">
        <p class="inspector__group">Поля карточки</p>
        <label
          v-for="field in cardFieldOptions"
          :key="field.key"
          class="inspector__check"
        >
          <input
            type="checkbox"
            :checked="cardFieldChecked(selectedObject.id, field.key)"
            @change="toggleCardField(selectedObject.id, field.key)"
          />
          <span>{{ field.label }}</span>
        </label>
      </div>
      <div class="inspector__actions">
        <BaseButton v-if="canOpen" variant="primary" @click="openSelected">Открыть</BaseButton>
        <BaseButton variant="ghost" @click="editingObject = { ...selectedObject }">Редактировать</BaseButton>
        <BaseButton variant="danger" @click="confirmDeleteObject = true">Удалить</BaseButton>
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
        <BaseButton variant="danger" @click="confirmDeleteConnection = true">Удалить</BaseButton>
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
        <BaseButton variant="danger" @click="confirmDeleteRegion = true">Удалить</BaseButton>
      </div>
    </template>

    <div v-else class="inspector__empty">
      <span class="inspector__empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      </span>
      <p class="inspector__empty-title">Ничего не выбрано</p>
      <p class="dim inspector__empty-text">
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
      :message="multiCount > 1
        ? `Будут удалены ${multiCount} объектов и все их связи. Продолжить?`
        : 'Объект и все его связи будут удалены. Продолжить?'"
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
import { cardFieldChecked, toggleCardField } from '../../utils/cardFields';
import { parseTags, tagKey, tagRegistry } from '../../utils/tags';

const {
  updateObject,
  markOpened,
  deleteObject,
  updateConnection,
  deleteConnection,
  updateRegion,
  deleteRegion,
  createConnection,
} = useGraph();
const { openPath, openUrl } = useElectron();

const editingObject = ref(null);
const editingRegion = ref(null);
const connectionLabel = ref('');
const connectionColor = ref('');
const confirmDeleteObject = ref(false);
const confirmDeleteConnection = ref(false);
const confirmDeleteRegion = ref(false);
const multiTagName = ref('');

const cardFieldOptions = [
  { key: 'title', label: 'Название' },
  { key: 'type', label: 'Тип' },
  { key: 'disk', label: 'Диск' },
  { key: 'dates', label: 'Даты' },
  { key: 'tags', label: 'Теги' },
];

const multiCount = computed(() => uiStore.selectedObjectIds.length);

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

watch(() => uiStore.pendingDelete, (kind) => {
  if (!kind) return;
  uiStore.pendingDelete = null;
  if (kind === 'object' && selectedObject.value) confirmDeleteObject.value = true;
  else if (kind === 'connection' && selectedConnection.value) confirmDeleteConnection.value = true;
  else if (kind === 'region' && selectedRegion.value) confirmDeleteRegion.value = true;
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

function connectionPairKey(sourceId, targetId) {
  return sourceId < targetId ? `${sourceId}-${targetId}` : `${targetId}-${sourceId}`;
}

async function applyMultiTag() {
  const name = multiTagName.value.trim();
  if (!name || multiCount.value < 2) return;
  const known = tagRegistry(graphStore.objects)
    .find((tag) => tagKey(tag.name) === tagKey(name));
  const tag = { name, color: known?.color || '#8f8f8f' };
  try {
    for (const id of uiStore.selectedObjectIds) {
      const object = graphStore.objects.find((item) => item.id === id);
      if (!object) continue;
      const tags = parseTags(object.tags);
      if (tags.some((item) => tagKey(item.name) === tagKey(name))) continue;
      await updateObject(id, { ...object, tags: [...tags, tag] });
    }
    multiTagName.value = '';
    uiStore.setStatus(`Тег «${name}» добавлен выделенным`);
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось назначить тег');
  }
}

async function connectSelected(pairs) {
  const existing = new Set(
    graphStore.connections.map((item) => connectionPairKey(item.sourceId, item.targetId)),
  );
  let created = 0;
  try {
    for (const [sourceId, targetId] of pairs) {
      const key = connectionPairKey(sourceId, targetId);
      if (sourceId === targetId || existing.has(key)) continue;
      await createConnection(sourceId, targetId);
      existing.add(key);
      created += 1;
    }
    uiStore.setStatus(created ? `Создано связей: ${created}` : 'Все связи уже существуют');
  } catch (error) {
    uiStore.setStatus(error.message || 'Не удалось создать связи');
  }
}

function connectSelectedPairs() {
  const ids = [...uiStore.selectedObjectIds];
  const pairs = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      pairs.push([ids[i], ids[j]]);
    }
  }
  connectSelected(pairs);
}

function connectSelectedChain() {
  const ids = [...uiStore.selectedObjectIds];
  const pairs = ids.slice(0, -1).map((id, index) => [id, ids[index + 1]]);
  connectSelected(pairs);
}

async function deleteSelectedObject() {
  const ids = multiCount.value > 1
    ? [...uiStore.selectedObjectIds]
    : selectedObject.value
      ? [selectedObject.value.id]
      : [];
  if (!ids.length) return;
  try {
    for (const id of ids) {
      await deleteObject(id);
    }
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
  font-family: var(--ls-font-display);
  font-size: 0.98rem;
  font-weight: 650;
}

.inspector__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ls-space-2);
  margin-top: var(--ls-space-4);
}

.inspector__group {
  margin: 0 0 var(--ls-space-2);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ls-text-faint);
}

.inspector__fields {
  margin-top: var(--ls-space-4);
  padding-top: var(--ls-space-3);
  border-top: 1px solid var(--ls-border-subtle);
}

.inspector__check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.8rem;
  color: var(--ls-text-muted);
  cursor: pointer;
}

.inspector__check input {
  appearance: none;
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin: 0;
  border: 1px solid var(--ls-border);
  border-radius: 4px;
  background: var(--ls-bg-soft);
  cursor: pointer;
  position: relative;
  flex: 0 0 14px;
  transition: background var(--ls-transition), border-color var(--ls-transition);
}

.inspector__check input:checked {
  background: #fff;
  border-color: #fff;
}

.inspector__check input:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #111;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.inspector__tag-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inspector__tag-row input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--ls-border);
  background: var(--ls-bg);
  border-radius: var(--ls-radius-sm);
  padding: 6px 10px;
  min-height: var(--ls-control-h);
  color: var(--ls-text);
  font-size: 0.82rem;
}

.inspector__tag-row input:focus {
  border-color: var(--ls-text-dim);
  outline: none;
}

.inspector__actions--tight {
  margin-top: 0;
}

.inspector__check:hover {
  color: var(--ls-text);
}

.inspector__meta {
  margin: 0 0 var(--ls-space-4);
  display: flex;
  flex-direction: column;
}

.inspector__meta > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--ls-space-3);
  padding: 6px 0;
  border-top: 1px solid var(--ls-border-subtle);
}

.inspector__meta > div:first-child {
  border-top: none;
  padding-top: 2px;
}

.inspector__meta dt {
  flex: 0 0 auto;
  font-size: 0.72rem;
  color: var(--ls-text-dim);
}

.inspector__meta dd {
  margin: 0;
  font-size: 0.8rem;
  text-align: right;
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
  padding: 7px 10px;
  min-height: var(--ls-control-h);
  color: var(--ls-text);
  font-size: 0.82rem;
  transition: border-color var(--ls-transition);
}

.inspector__field input:focus {
  border-color: var(--ls-text-dim);
  outline: none;
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
  align-items: center;
  gap: var(--ls-space-2);
  padding: var(--ls-space-6) var(--ls-space-3);
  text-align: center;
}

.inspector__empty-icon {
  display: inline-flex;
  color: var(--ls-text-faint);
  margin-bottom: var(--ls-space-1);
}

.inspector__empty-icon svg {
  width: 34px;
  height: 34px;
}

.inspector__empty-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ls-text-muted);
}

.inspector__empty-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
}
</style>
