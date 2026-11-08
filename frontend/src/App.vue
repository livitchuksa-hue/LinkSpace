<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-body">
      <Sidebar />
      <main class="workspace">
        <GraphView v-if="uiStore.currentView === 'graph'" />
        <SettingsView v-else />
      </main>
      <InspectorPanel />
    </div>
  </div>
</template>

<script setup>
import AppHeader from './components/layout/AppHeader.vue';
import Sidebar from './components/layout/Sidebar.vue';
import InspectorPanel from './components/layout/InspectorPanel.vue';
import GraphView from './views/GraphView.vue';
import SettingsView from './views/SettingsView.vue';
import { uiStore } from './stores/uiStore';
</script>
