import { cache } from '@overextended/ox_lib';
import { CloseInventory } from './inventory';
import { triggerServerCallback } from '@overextended/ox_lib/client';
import { currentWeapon } from './weapon';
import { UseItem } from './item';
import type { InventoryItem } from '@common/item';

RegisterCommand(
  'openInventory',
  () => {
    // todo: hotbar
    // const isTabDown = IsRawKeyDown(0x09);

    const nearbyInventories = exports[cache.resource].getNearbyInventories();
    emitNet('ox_inventory:requestOpenInventory', nearbyInventories);
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
