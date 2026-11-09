<template>
  <svg class="type-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="type === 'NOTE'">
      <path d="M7 3.5h7.5L19 8v12.5H7z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M10 12h6M10 15.5h6" />
    </template>
    <template v-else-if="type === 'FOLDER'">
      <path d="M3.5 6.5h6l2 2h9v10h-17z" />
      <path d="M3.5 9.5h17" />
    </template>
    <template v-else-if="type === 'LINK'">
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2-2a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2 2a4 4 0 0 0 5.7 5.7l1-1" />
    </template>
    <template v-else>
      <path d="M6.5 3.5h8l4 4v13h-12z" />
      <path d="M14.5 3.5v4h4" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'FILE',
  },
});
</script>

<style scoped>
.type-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
