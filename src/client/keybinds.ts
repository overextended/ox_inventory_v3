import type { InventoryItem } from '@common/item';
import { triggerServerCallback } from '@overextended/ox_lib/client';
import { CloseInventory, RequestOpenInventory } from './inventory';
import { UseItem } from './item';
import { currentWeapon } from './weapon';

RegisterCommand(
  'openInventory',
  () => {
    // todo: hotbar
    // const isTabDown = IsRawKeyDown(0x09);

    RequestOpenInventory();
  },
  false,
);

RegisterCommand('closeInventory', CloseInventory, false);

RegisterCommand(
  'reloadweapon',
  async () => {
    if (!currentWeapon.ammoName) return;

    const item = await triggerServerCallback<InventoryItem>('ox_inventory:findInventoryItem', 200, {
      name: currentWeapon.ammoName,
    });

    if (!item) return;

    UseItem(item.uniqueId);
  },
  false,
);

RegisterKeyMapping('openInventory', 'Access player inventory', 'keyboard', 'TAB');
RegisterKeyMapping('reloadweapon', 'Reload current weapon', 'keyboard', 'R');
