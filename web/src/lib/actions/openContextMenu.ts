import type { Action } from 'svelte/action';
import { contextMenu } from '$lib/state/context-menu.svelte';
import { fetchNui } from '$lib/utils/fetchNui';

export interface ContextMenuButtonResponse {
  buttonId: string;
  label: string;
  icon?: string;
  menu?: Omit<ContextMenuButtonResponse[], 'menu'>;
}

export const openContextMenu: Action<HTMLElement, { itemId: string }> = (node, { itemId }) => {
  node.addEventListener('contextmenu', async (e) => {
    e.preventDefault();

    const buttons = await fetchNui<ContextMenuButtonResponse[]>('openContextMenu', itemId, {
      data: [
        {
          buttonId: 'attachments',
          label: 'Attachments',
          icon: 'hugeicons:attachment-01',
          menu: [
            {
              buttonId: 'stock',
              label: 'Gun Stock',
              icon: 'game-icons:gun-stock',
            },
            {
              buttonId: 'stock',
              label: 'Silencer',
              icon: 'game-icons:australia',
            },
            {
              buttonId: 'stock',
              label: 'Extended Magazine',
              icon: 'game-icons:machine-gun-magazine',
            },
          ],
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
