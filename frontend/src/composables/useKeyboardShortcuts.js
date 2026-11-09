import { onMounted, onBeforeUnmount } from 'vue';
import { uiStore, useUiStore } from '../stores/uiStore';
import { canvasRef } from './useGraphActions';

const TYPING_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

function isTyping(target) {
  return Boolean(target?.closest?.(TYPING_SELECTOR));
}

function modalOpen() {
  return Boolean(document.querySelector('.modal'));
}

/**
 * Глобальные горячие клавиши графа.
 * Escape обрабатывается модалками (BaseModal), здесь — только состояние канваса.
 */
export function useKeyboardShortcuts() {
  const { clearSelection, setTool } = useUiStore();

  function onKeydown(event) {
    if (event.defaultPrevented || modalOpen() || isTyping(event.target)) return;

    if (event.key === 'Escape') {
      if (uiStore.tool === 'region') {
        canvasRef.value?.cancelRegion?.();
        setTool('select');
        return;
      }
      if (uiStore.tool === 'connect') {
        setTool('select');
        return;
      }
      if (uiStore.selectedObjectId || uiStore.selectedConnectionId || uiStore.selectedRegionId) {
        clearSelection();
      }
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (uiStore.selectedObjectId) uiStore.pendingDelete = 'object';
      else if (uiStore.selectedConnectionId) uiStore.pendingDelete = 'connection';
      else if (uiStore.selectedRegionId) uiStore.pendingDelete = 'region';
      return;
    }

    if (event.key === 'Enter' && uiStore.tool === 'region') {
      event.preventDefault();
      canvasRef.value?.finishRegion?.();
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
