import { CloseInventory } from './nui';

RegisterCommand(
  'openInventory',
  () => {
    // todo: hotbar
    // const isTabDown = IsRawKeyDown(0x09);

    emitNet(`ox_inventory:requestOpenInventory`);
  },
  false
);

RegisterCommand('closeInventory', CloseInventory, false);
RegisterKeyMapping('openInventory', 'Access player inventory', 'keyboard', 'TAB');
