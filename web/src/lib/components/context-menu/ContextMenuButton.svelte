<script lang="ts">
import Icon from '@iconify/svelte';
import { contextMenu } from '$lib/state/context-menu.svelte.js';
import { fetchNui } from '$lib/utils/fetchNui';

interface ContextMenuButtonProps {
  buttonId: string;
  label: string;
  icon?: string;
}

const { icon, label, buttonId }: ContextMenuButtonProps = $props();

function buttonClick(e: MouseEvent) {
  e.stopImmediatePropagation();

  fetchNui('contextMenuClick', { itemId: contextMenu.itemId, buttonId });

  contextMenu.close();
}
</script>

<button class="p-2 flex gap-2 text-sm items-center hover:bg-secondary" onclick={buttonClick}>
  {#if icon}
    <Icon {icon} width="20" height="20" />
  {/if}
  <p>{label}</p>
</button>
