import { BaseInventory } from '@common/inventory/class';
import { InventoryItem } from '@common/item';

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

RegisterNuiCallback(`moveItem`, (data: any, cb: (status: number) => void) => {
  emitNet(`ox_inventory:requestMoveItem`, data);
  cb(1);
});
