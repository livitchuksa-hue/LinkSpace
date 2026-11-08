<template>
  <BaseModal :model-value="modelValue" :title="title" @update:model-value="onUpdate">
    <p class="confirm__text">{{ message }}</p>
    <template #footer>
      <BaseButton variant="ghost" @click="cancel">Отмена</BaseButton>
      <BaseButton variant="primary" @click="confirm">Подтвердить</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Подтверждение' },
  message: { type: String, default: 'Вы уверены?' },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

function onUpdate(value) {
  emit('update:modelValue', value);
}

function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

function confirm() {
  emit('confirm');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.confirm__text {
  margin: 0;
  color: var(--ls-text-muted);
}
</style>
