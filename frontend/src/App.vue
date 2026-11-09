<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-body">
      <main class="workspace">
        <GraphView />
      </main>
      <FloatingPanel
        side="left"
        :pinned="uiStore.leftPanelPinned"
        @update:pinned="uiStore.leftPanelPinned = $event"
      >
        <Sidebar />
      </FloatingPanel>
      <FloatingPanel
        side="right"
        :pinned="uiStore.rightPanelPinned"
        :reveal="hasSelection"
        @update:pinned="uiStore.rightPanelPinned = $event"
      >
        <InspectorPanel />
      </FloatingPanel>
    </div>

    <BaseModal
      :model-value="uiStore.settingsOpen"
      title="Настройки"
      @update:model-value="(value) => { uiStore.settingsOpen = value; }"
    >
      <SettingsView v-if="uiStore.settingsOpen" />
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import AppHeader from './components/layout/AppHeader.vue';
import Sidebar from './components/layout/Sidebar.vue';
import InspectorPanel from './components/layout/InspectorPanel.vue';
import FloatingPanel from './components/layout/FloatingPanel.vue';
import GraphView from './views/GraphView.vue';
import SettingsView from './views/SettingsView.vue';
import BaseModal from './components/common/BaseModal.vue';
import { uiStore } from './stores/uiStore';
import { useWorkspaceSettings } from './composables/useWorkspaceSettings';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';

const { loadSettings, bindSettingsPersistence } = useWorkspaceSettings();
bindSettingsPersistence();
useKeyboardShortcuts();

const hasSelection = computed(() => Boolean(
  uiStore.selectedObjectId || uiStore.selectedConnectionId || uiStore.selectedRegionId,
));

onMounted(() => {
  loadSettings();
});
</script>
