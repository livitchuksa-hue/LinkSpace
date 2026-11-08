<template>
  <form class="editor" @submit.prevent="submit">
    <label class="editor__field">
      <span>Название</span>
      <input v-model="form.title" type="text" required maxlength="200" />
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
      <textarea v-model="form.description" rows="3" />
    </label>

    <p v-if="error" class="editor__error">{{ error }}</p>

    <div class="editor__actions">
      <BaseButton variant="ghost" type="button" @click="$emit('cancel')">Отмена</BaseButton>
      <BaseButton variant="primary" type="submit">Сохранить</BaseButton>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue';
import BaseButton from '../common/BaseButton.vue';
import { validateObjectPayload } from '../../utils/validators';

const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  title: '',
  type: 'NOTE',
  description: '',
  content: '',
  path: null,
  url: null,
  x: 120,
  y: 120,
});

const error = ref(null);

function submit() {
  error.value = validateObjectPayload(form);
  if (error.value) return;
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
