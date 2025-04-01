import config from '@common/config';
import type { InventoryItem } from '@common/item';
import { cache } from '@overextended/ox_lib';
import { triggerServerCallback } from '@overextended/ox_lib/client';
import vehicleClasses from '@static/vehicleClasses.json';
import { CloseInventory, GetNearbyInventories } from './inventory';
import { UseItem } from './item';
import { currentWeapon } from './weapon';

RegisterCommand(
  'openInventory',
  () => {
    // todo: hotbar
    // const isTabDown = IsRawKeyDown(0x09);

    const inventories = GetNearbyInventories();

    const { vehicle, seat } = cache;

    if (vehicle && seat && seat < 2) {
      const vehicleClass = vehicleClasses[GetVehicleClass(vehicle)];
      const configKey = `Vehicle_${vehicleClass}_Glovebox_Weight`;
      const hasGlovebox = config[configKey as any];

      if (hasGlovebox) {
        inventories.push(`glovebox:${NetworkGetNetworkIdFromEntity(vehicle)}`);
      }
    }

    emitNet('ox_inventory:requestOpenInventory', inventories);
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
