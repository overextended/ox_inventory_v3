import { CloseInventory } from './inventory';
import { GetInventoryItem, UseItem } from './item';

interface ContextMenuAction {
  buttonId: string;
  label: string;
  icon: string;
}

RegisterNuiCallback('openContextMenu', async (itemId: number, cb: NuiCb) => {
  const item = await GetInventoryItem(itemId);
  const response: ContextMenuAction[] = [];

  if (item.category === 'weapon') {
    response.push({
      buttonId: 'unload',
      label: 'Unload',
      icon: 'game-icons:machine-gun-magazine',
    });
  }

  cb(response);
});

RegisterNuiCallback(
  'contextMenuClick',
  async ({ itemId, buttonId }: { itemId: number; buttonId: string }, cb: NuiCb) => {
    const item = await GetInventoryItem(itemId);

    if (!item) return cb(0);

    switch (buttonId) {
      case 'use':
        return UseItem(itemId);
      case 'give':
        return; //todo
      case 'unload':
        return; //todo
    }

    cb(1);
  },
);
