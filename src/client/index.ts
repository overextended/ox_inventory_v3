import { BaseInventory } from '@common/inventory/class';
import { InventoryItem } from '@common/item';

RegisterCommand('openInventory', () => emitNet(`ox_inventory:requestOpenInventory`), false);

RegisterCommand(
  'closeInventory',
  () => {
    SetNuiFocus(false, false);
    SendNUIMessage({
      action: 'closeInventory',
    });
  },
  false
);

RegisterNuiCallback(`getStateKeyValue`, ([state, key]: [state: string, key: string], cb: (value: unknown) => void) => {
  const value = state === 'global' ? GlobalState[key] : LocalPlayer.state[key];

  cb(value);
});

RegisterNuiCallback(`moveItem`, (data: any, cb: (status: number) => void) => {
  emitNet(`ox_inventory:requestMoveItem`, data);
  cb(1);
});

onNet(`ox_inventory:openInventory`, async (data: { inventory: BaseInventory; items: InventoryItem[] }) => {
  SetNuiFocus(true, true);
  SendNUIMessage({
    action: 'openInventory',
    data: data,
  });
});
