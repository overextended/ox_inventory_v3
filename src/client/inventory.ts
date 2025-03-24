import type { BaseInventory } from '@common/inventory/class';
import type { InventoryItem } from '@common/item/index';
import { cache, triggerServerCallback } from '@overextended/ox_lib/client';
import './context';
import { ValidateItemData } from './item';

export enum InventoryState {
  Closed = 0,
  Closing = 1,
  Open = 2,
  Busy = 3,
}

export let inventoryState: InventoryState = InventoryState.Closed;

export async function OpenInventory(data: { inventory: BaseInventory; items: InventoryItem[]; playerId: number }) {
  data.playerId = cache.serverId;

  await Promise.all(data.items.map(ValidateItemData));

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

onNet('ox_inventory:openInventory', OpenInventory);

onNet('ox_inventory:closeInventory', CloseInventory);

onNet('ox_inventory:updateItem', async (...args: InventoryItem[]) => {
  await Promise.all(args.map(ValidateItemData));

  SendNUIMessage({
    action: 'updateItem',
    data: args,
  });
});

onNet('ox_inventory:clearInventory', (data: { inventoryId: string; keepItems?: number[] }) => {
  SendNUIMessage({
    action: 'clearInventory',
    data,
  });
});
