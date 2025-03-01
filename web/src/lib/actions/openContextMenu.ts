import type { Action } from 'svelte/action';
import { contextMenu } from '$lib/state/context-menu.svelte';
import { fetchNui } from '$lib/utils/fetchNui';

export interface ContextMenuButtonResponse {
  buttonId: string;
  label: string;
  icon?: string;
}

export const openContextMenu: Action<HTMLElement, { itemId: string }> = (node, { itemId }) => {
  node.addEventListener('contextmenu', async (e) => {
    e.preventDefault();

    const buttons = await fetchNui<ContextMenuButtonResponse[]>('openContextMenu', itemId, {
      data: [
        {
          buttonId: 'unpack',
          label: 'Unpack',
          icon: 'hugeicons:package-open',
        },
        {
          buttonId: 'lock',
          label: 'Lock',
          icon: 'hugeicons:square-lock-02',
        },
      ],
    });

    const x = e.clientX;
    const y = e.clientY;

    contextMenu.open({
      x,
      y,
      itemId,
      buttons: buttons ?? [],
    });
  });
};
