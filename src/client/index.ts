import { BaseInventory } from '@common/inventory/class';
import { InventoryItem } from '@common/item';
import { CloseInventory } from './nui';
import './keybinds';

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

setTick(() => DisableControlAction(0, 37, true));
