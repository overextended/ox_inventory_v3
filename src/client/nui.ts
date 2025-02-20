import { BaseInventory } from '@common/inventory/class';
import { InventoryItem } from '@common/item';
import { triggerServerCallback } from '@overextended/ox_lib/client';

export function OpenInventory(data: { inventory: BaseInventory; items: InventoryItem[] }) {
  SetNuiFocus(true, true);
  SendNUIMessage({
    action: 'openInventory',
    data: data,
  });
}

export function CloseInventory() {
  emitNet(`ox_inventory:closeInventory`);
  SetNuiFocus(false, false);
  SendNUIMessage({
    action: 'closeInventory',
  });
}

RegisterNuiCallback(`closeInventory`, (_: never, cb: (value: number) => void) => {
  CloseInventory();
  cb(1);
});

RegisterNuiCallback(`getStateKeyValue`, ([state, key]: [state: string, key: string], cb: (value: unknown) => void) => {
  const value = state === 'global' ? GlobalState[key] : LocalPlayer.state[key];

  cb(value);
});

RegisterNuiCallback(`moveItem`, async (data: MoveItem, cb: (status: number) => void) => {
  const response = await triggerServerCallback<boolean>(`ox_inventory:requestMoveItem`, 50, data);
  cb(response ? 1 : 0);
});
