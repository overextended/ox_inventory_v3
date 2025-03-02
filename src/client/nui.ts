import type { BaseInventory } from '@common/inventory/class';
import type { InventoryItem } from '@common/item';
import { cache, triggerServerCallback } from '@overextended/ox_lib/client';
import { GetInventoryItem, UseItem } from './item';

export function OpenInventory(data: { inventory: BaseInventory; items: InventoryItem[]; playerId: number }) {
  data.playerId = cache.serverId;

  SetNuiFocus(true, true);
  SendNUIMessage({
    action: 'openInventory',
    data: data,
  });
}

export function CloseInventory(data?: { inventoryId: string; inventoryCount: number }, cb?: NuiCb) {
  emitNet('ox_inventory:closeInventory', data?.inventoryId);

  SendNUIMessage({
    action: 'closeInventory',
    data: data?.inventoryId,
  });

  if (!data || !data.inventoryCount) {
    SetNuiFocus(false, false);
  }

  if (cb) cb(1);
}

type NuiCb = (value: unknown) => void;

RegisterNuiCallback('closeInventory', CloseInventory);

RegisterNuiCallback('getStateKeyValue', ([state, key]: [state: string, key: string], cb: (value: unknown) => void) => {
  const value = state === 'global' ? GlobalState[key] : LocalPlayer.state[key];

  cb(value);
});

RegisterNuiCallback('moveItem', async (data: MoveItem, cb: NuiCb) => {
  if (data.toType === 'drop' && !data.toId) {
    const nearestDrop = exports[cache.resource].getClosestInventory('drop');

    if (nearestDrop) {
      data.toId = nearestDrop;
      delete data.toSlot;
    } else data.coords = GetEntityCoords(cache.ped, true) as [number, number, number];
  }

  const response = await triggerServerCallback<boolean>('ox_inventory:requestMoveItem', 50, data);
  cb(response ? 1 : 0);
});

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
        CloseInventory(null, cb);

        return UseItem(itemId);
      case 'give':
        return; //todo
      case 'unload':
        return; //todo
    }

    cb(1);
  },
);
