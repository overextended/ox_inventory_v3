import { BaseInventory } from '@common/inventory/class';
import { InventoryItem } from '@common/item';

function CloseInventory() {
  SetNuiFocus(false, false);
  SendNUIMessage({
    action: 'closeInventory',
  });
}

RegisterCommand('openInventory', () => emitNet(`ox_inventory:requestOpenInventory`), false);
RegisterCommand('closeInventory', CloseInventory, false);

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

onNet(`ox_inventory:closeInventory`, CloseInventory);

onNet(`ox_inventory:moveItem`, () => {
  // todo: refresh only updated slots. for now, re-open inventory to force a refresh
  ExecuteCommand('openInventory');
});
