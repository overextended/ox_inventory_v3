import { BaseInventory } from '@common/inventory/class';
import { InventoryItem } from '@common/item';
import { cache, triggerServerCallback } from '@overextended/ox_lib/client';

export function OpenInventory(data: { inventory: BaseInventory; items: InventoryItem[] }) {
  SetNuiFocus(true, true);
  SendNUIMessage({
    action: 'openInventory',
    data: data,
  });
}

export function CloseInventory(data?: { inventoryId: string; inventoryCount: number }, cb?: (value: number) => void) {
  emitNet(`ox_inventory:closeInventory`, data?.inventoryId);

  SendNUIMessage({
    action: 'closeInventory',
    data: data?.inventoryId,
  });

  if (!data || !data.inventoryCount) {
    SetNuiFocus(false, false);
  }

  if (cb) cb(1);
}

RegisterNuiCallback(`closeInventory`, CloseInventory);

RegisterNuiCallback(`getStateKeyValue`, ([state, key]: [state: string, key: string], cb: (value: unknown) => void) => {
  const value = state === 'global' ? GlobalState[key] : LocalPlayer.state[key];

  cb(value);
});

RegisterNuiCallback(`moveItem`, async (data: MoveItem, cb: (status: number) => void) => {
  if (data.toType === 'drop' && !data.toId) {
    const nearestDrop = exports[cache.resource].getClosestInventory('drop');

    if (nearestDrop) {
      data.toId = nearestDrop;
      delete data.toSlot;
    } else data.coords = GetEntityCoords(cache.ped, true) as [number, number, number];
  }

  const response = await triggerServerCallback<boolean>(`ox_inventory:requestMoveItem`, 50, data);
  cb(response ? 1 : 0);
});
