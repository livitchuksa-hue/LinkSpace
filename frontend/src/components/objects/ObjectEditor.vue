<template>
  <form class="editor" @submit.prevent="submit">
    <label class="editor__field">
      <span>Название</span>
      <input v-model="form.title" type="text" maxlength="200" :placeholder="titlePlaceholder" />
    </label>

    <label class="editor__field">
      <span>Тип</span>
      <select v-model="form.type">
        <option value="NOTE">Заметка</option>
        <option value="FILE">Файл</option>
        <option value="FOLDER">Папка</option>
        <option value="LINK">Ссылка</option>
      </select>
    </label>

    <label class="editor__field">
      <span>Описание</span>
      <textarea v-model="form.description" rows="3" placeholder="Необязательное описание" />
    </label>

    <label v-if="form.type === 'NOTE'" class="editor__field">
      <span>Содержимое заметки</span>
      <textarea v-model="form.content" rows="7" placeholder="Текст заметки" />
    </label>

    <div class="editor__field">
      <span>Цвет объекта</span>
      <div class="editor__color">
        <input
          type="color"
          :value="form.color || '#e0e7ff'"
          @input="form.color = $event.target.value"
        />
        <input v-model="form.color" type="text" maxlength="7" placeholder="#e0e7ff" />
      </div>
      <p class="editor__hint">HEX-цвет вроде #e0e7ff. Пустое поле вернёт стандартный цвет типа/расширения.</p>
    </div>

    <div class="editor__field">
      <span>Теги</span>
      <div v-if="existingTags.length" class="editor__tags">
        <button
          v-for="tag in existingTags"
          :key="tagKey(tag.name)"
          type="button"
          class="editor__tag"
          :class="{ 'editor__tag--active': isTagActive(tag) }"
          :style="isTagActive(tag) ? { background: tag.color, color: '#fff', borderColor: tag.color } : {}"
          @click="toggleTag(tag)"
        >
          {{ tag.name }}
        </button>
      </div>
      <p v-else class="editor__hint">Тегов пока нет — создайте первый ниже.</p>
      <div class="editor__newtag">
        <input v-model="newTag.name" type="text" maxlength="40" placeholder="Новый тег" />
        <input v-model="newTag.color" type="color" aria-label="Цвет тега" />
        <BaseButton variant="ghost" type="button" :disabled="!newTag.name.trim()" @click="addNewTag">
          Добавить
        </BaseButton>
      </div>
    </div>

    <div v-if="form.type === 'NOTE'" class="editor__field">
      <span>Файл заметки (.md)</span>
      <div class="editor__path">
        <input v-model="form.path" type="text" placeholder="Необязательно — например C:\notes\idea.md" />
        <BaseButton v-if="isElectron" variant="ghost" type="button" @click="chooseNoteFile">Выбрать…</BaseButton>
      </div>
      <p class="editor__hint">Если указан путь, текст заметки хранится в .md файле. Пустое поле — заметка живёт только в базе приложения.</p>
    </div>

    <div v-if="form.type === 'FILE' || form.type === 'FOLDER'" class="editor__field">
      <span>Путь</span>
      <div class="editor__path">
        <input v-model="form.path" type="text" readonly :placeholder="isElectron ? 'Выберите файл или папку' : 'Вставьте путь вручную'" />
        <BaseButton v-if="isElectron" variant="ghost" type="button" @click="choosePath">
          {{ form.type === 'FOLDER' ? 'Папка' : 'Файл' }}
        </BaseButton>
      </div>
      <p v-if="!isElectron" class="editor__hint">В браузерном режиме диалог недоступен — укажите путь вручную.</p>
    </div>

    <label v-if="form.type === 'LINK'" class="editor__field">
      <span>URL</span>
      <input v-model="form.url" type="url" required placeholder="https://example.com" />
    </label>

    <div v-if="form.type === 'LINK'" class="editor__field">
      <span>Превью страницы</span>
      <div class="editor__path">
        <span class="editor__hint">
          {{ linkPreviewState }}
        </span>
        <BaseButton variant="ghost" type="button" :disabled="linkPreviewLoading || !form.url.trim()" @click="refreshLinkPreview">
          Обновить
        </BaseButton>
      </div>
      <p class="editor__hint">Favicon, заголовок и картинка og:image сохраняются в карточке. Обновляется автоматически при сохранении.</p>
    </div>

    <p v-if="error" class="editor__error">{{ error }}</p>

    <div class="editor__actions">
      <BaseButton variant="ghost" type="button" @click="$emit('cancel')">Отмена</BaseButton>
      <BaseButton variant="primary" type="submit">Сохранить</BaseButton>
    </div>
  </form>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import BaseButton from '../common/BaseButton.vue';
import { useElectron } from '../../composables/useElectron';
import { fileNameFromPath } from '../../utils/formatters';
import { validateObjectPayload } from '../../utils/validators';
import { normalizeHex } from '../../utils/nodeAppearance';
import { graphStore } from '../../stores/graphStore';
import { parseTags, tagKey, tagRegistry } from '../../utils/tags';
import { parseLinkPreview, serializeLinkPreview } from '../../utils/linkPreview';

const props = defineProps({
  object: { type: Object, default: null },
  defaultType: { type: String, default: 'NOTE' },
});

const emit = defineEmits(['save', 'cancel']);
const { isElectron, selectFile, selectFolder, statPath, readText, writeText, unfurlLink } = useElectron();

const form = reactive({
  title: props.object?.title || '',
  type: props.object?.type || props.defaultType || 'NOTE',
  description: props.object?.description || '',
  content: props.object?.content || '',
  path: props.object?.path || '',
  url: props.object?.url || '',
  disk: props.object?.disk || null,
  fileSize: props.object?.fileSize ?? null,
  fileCreatedAt: props.object?.fileCreatedAt || null,
  fileModifiedAt: props.object?.fileModifiedAt || null,
  x: props.object?.x ?? 120,
  y: props.object?.y ?? 120,
  color: props.object?.color || '',
  preview: props.object?.preview || '',
  width: props.object?.width ?? null,
  height: props.object?.height ?? null,
  tags: parseTags(props.object?.tags),
});

const newTag = reactive({ name: '', color: '#8f8f8f' });

const existingTags = computed(() => tagRegistry(graphStore.objects));

const error = ref(null);

watch(
  () => [form.type, form.path],
  async () => {
    if (form.type !== 'NOTE' || !form.path.trim() || !isElectron) return;
    const result = await readText(form.path.trim());
    if (result?.ok) {
      form.content = result.text;
    }
  },
  { immediate: true },
);

watch(() => form.type, (type) => {
  if (type === 'NOTE') {
    form.path = '';
    form.url = '';
    form.disk = null;
    form.fileSize = null;
    form.fileCreatedAt = null;
    form.fileModifiedAt = null;
  } else if (type === 'LINK') {
    form.path = '';
    form.content = '';
    form.disk = null;
    form.fileSize = null;
    form.fileCreatedAt = null;
    form.fileModifiedAt = null;
  } else {
    form.url = '';
    form.content = '';
  }
});

const titlePlaceholder = computed(() => {
  if (form.type === 'LINK') return 'Название ссылки';
  if (form.type === 'FILE' || form.type === 'FOLDER') return 'Название (по умолчанию — имя файла)';
  return 'Название заметки';
});

const linkPreviewLoading = ref(false);

const linkPreviewState = computed(() => {
  const preview = parseLinkPreview(form.preview);
  if (!preview) {
    return isElectron ? 'Превью ещё не загружено — обновится при сохранении' : 'Доступно только в приложении';
  }
  const parts = [];
  if (preview.title) parts.push(preview.title);
  parts.push(preview.image ? 'с изображением' : 'без изображения');
  return parts.join(' · ');
});

async function refreshLinkPreview() {
  const url = form.url.trim();
  if (!url || !isElectron) return;
  linkPreviewLoading.value = true;
  error.value = null;
  try {
    const result = await unfurlLink(url);
    if (result?.ok) {
      form.preview = serializeLinkPreview(result) || '';
      if (!form.title.trim() && result.title) {
        form.title = result.title;
      }
    } else {
      error.value = result?.error || 'Не удалось загрузить превью';
    }
  } finally {
    linkPreviewLoading.value = false;
  }
}

async function chooseNoteFile() {
  const selected = await selectFile({
    filters: [{ name: 'Markdown / текст', extensions: ['md', 'markdown', 'txt'] }],
  });
  const target = selected[0];
  if (!target) return;
  form.path = target;
  const result = await readText(target);
  if (result?.ok) {
    form.content = result.text;
  }
}

async function choosePath() {
  error.value = null;
  const selected = form.type === 'FOLDER' ? await selectFolder() : (await selectFile())[0];
  if (!selected) return;
  await applyPath(selected, form.type === 'FOLDER' ? 'FOLDER' : 'FILE');
}

async function applyPath(targetPath, type) {
  form.path = targetPath;
  if (!form.title) {
    form.title = fileNameFromPath(targetPath) || 'Файл';
  }

  const stat = await statPath(targetPath);
  form.disk = stat.disk || null;
  form.fileSize = type === 'FOLDER' ? null : (stat.fileSize ?? null);
  form.fileCreatedAt = stat.fileCreatedAt || null;
  form.fileModifiedAt = stat.fileModifiedAt || null;

  if (!stat.exists && isElectron) {
    error.value = 'Выбранный путь не найден.';
  }
}

function isTagActive(tag) {
  const key = tagKey(tag.name);
  return form.tags.some((item) => tagKey(item.name) === key);
}

function toggleTag(tag) {
  const key = tagKey(tag.name);
  const index = form.tags.findIndex((item) => tagKey(item.name) === key);
  if (index === -1) {
    form.tags.push({ name: tag.name, color: tag.color });
  } else {
    form.tags.splice(index, 1);
  }
}

function addNewTag() {
  const name = newTag.name.trim();
  if (!name) return;
  const key = tagKey(name);
  if (!form.tags.some((item) => tagKey(item.name) === key)) {
    form.tags.push({ name, color: newTag.color });
  }
  newTag.name = '';
}

async function submit() {
  error.value = null;

  if (!form.title.trim()) {
    if (form.type === 'LINK' && form.url.trim()) {
      form.title = form.url.trim();
    } else if ((form.type === 'FILE' || form.type === 'FOLDER') && form.path.trim()) {
      form.title = fileNameFromPath(form.path);
    } else {
      form.title = 'Без названия';
    }
  }

  if ((form.type === 'FILE' || form.type === 'FOLDER') && !form.path.trim()) {
    error.value = 'Укажите путь к файлу или папке.';
    return;
  }

  if (form.type === 'LINK') {
    form.url = form.url.trim();
    if (!/^https?:\/\//i.test(form.url)) {
      error.value = 'URL должен начинаться с http:// или https://';
      return;
    }
  }

  const payload = validateObjectPayload(form);
  if (payload) {
    error.value = payload;
    return;
  }

  form.color = normalizeHex(form.color) || '';
  form.path = form.path.trim();

  if (form.type === 'NOTE' && form.path && isElectron) {
    const result = await writeText(form.path, form.content || '');
    if (!result.ok) {
      error.value = result.error || 'Не удалось записать файл заметки';
      return;
    }
  }

  if (
    form.type === 'LINK'
    && isElectron
    && form.url.trim()
    && (!form.preview || props.object?.url !== form.url.trim())
  ) {
    try {
      const result = await unfurlLink(form.url.trim());
      if (result?.ok) {
        form.preview = serializeLinkPreview(result) || form.preview;
        if (!form.title.trim() && result.title) {
          form.title = result.title;
        }
      }
    } catch {
      // превью необязательно — сохраняем ссылку без него
    }
  }

  emit('save', { ...form });
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--ls-space-3);
}

.editor__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--ls-text-muted);
}

.editor__field input,
.editor__field select,
.editor__field textarea {
  border: 1px solid var(--ls-border);
  background: var(--ls-bg);
  border-radius: var(--ls-radius-sm);
  padding: 8px 10px;
  color: var(--ls-text);
}

.editor__field textarea {
  resize: vertical;
  min-height: 96px;
  max-height: 280px;
  overflow: auto;
  line-height: 1.45;
}

.editor__color {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 8px;
  align-items: center;
}

.editor__color input[type='color'] {
  width: 44px;
  height: 34px;
  padding: 2px;
  cursor: pointer;
}

.editor__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.editor__tag {
  border: 1px solid var(--ls-border);
  background: transparent;
  color: var(--ls-text-muted);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.78rem;
  cursor: pointer;
}

.editor__tag--active {
  font-weight: 600;
}

.editor__newtag {
  display: grid;
  grid-template-columns: 1fr 44px auto;
  gap: 8px;
  align-items: center;
}

.editor__newtag input[type='color'] {
  width: 44px;
  height: 34px;
  padding: 2px;
  cursor: pointer;
}

.editor__path {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.editor__hint {
  margin: 0;
  color: var(--ls-text-dim);
  font-size: 0.75rem;
}

.editor__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ls-space-2);
  margin-top: var(--ls-space-2);
}

.editor__error {
  margin: 0;
  color: var(--ls-danger);
  font-size: 0.85rem;
}
</style>
