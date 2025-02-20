import { cache } from '@overextended/ox_lib';
import { CloseInventory } from './nui';

RegisterCommand(
  'openInventory',
  () => {
    // todo: hotbar
    // const isTabDown = IsRawKeyDown(0x09);

    const nearbyInventories = exports[cache.resource].getNearbyInventories();
    emitNet(`ox_inventory:requestOpenInventory`, nearbyInventories);
  },
  false
);

RegisterCommand('closeInventory', CloseInventory, false);
RegisterKeyMapping('openInventory', 'Access player inventory', 'keyboard', 'TAB');
