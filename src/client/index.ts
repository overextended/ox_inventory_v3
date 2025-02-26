import { CloseInventory, OpenInventory } from './nui';
import './keybinds';
import './item';
import './weapon';

onNet(`ox_inventory:openInventory`, OpenInventory);

onNet(`ox_inventory:closeInventory`, CloseInventory);

onNet(`ox_inventory:moveItem`, () => {
  // todo: refresh only updated slots. for now, re-open inventory to force a refresh
  ExecuteCommand('openInventory');
});
