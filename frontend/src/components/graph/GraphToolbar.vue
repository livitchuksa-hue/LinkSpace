<template>
  <div class="toolbar">
    <BaseButton variant="primary" @click="$emit('create-object')">
      Создать объект
    </BaseButton>
    <BaseButton variant="ghost" disabled title="Будет доступно позже">
      Связать
    </BaseButton>
    <BaseButton variant="ghost" disabled title="Будет доступно позже">
      Область
    </BaseButton>
  </div>
</template>

<script setup>
import BaseButton from '../common/BaseButton.vue';

defineEmits(['create-object']);
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ls-space-2);
}
</style>
