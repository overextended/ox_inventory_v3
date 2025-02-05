import { GetPlayer } from '@overextended/ox_core/server';
import { GetInventory } from './inventory';
import { Inventory } from './inventory/class';
import { CreateItem } from './item';

// setTimeout(async () => {
//   await sleep(100);

//   // const newItem = await CreateItem('water', { inventoryId: 'test' });
//   // console.log(newItem);

//   // const moved = newItem.move(inventory, 4);
//   // console.log('moved', moved);

//   await sleep(100);

//   console.log(inventory);

//   const item = GetInventoryItem(inventory.items[0]);

//   console.log(item);
//   console.log(item.icon);
// }, 500);

onNet(`ox_inventory:requestOpenInventory`, async () => {
  const playerId = source;
  const inventory = await GetInventory(playerId.toString(), `player`);

  if (!inventory) return;

  console.log(inventory.mapItems())

  emitNet(`ox_inventory:openInventory`, playerId, { inventory, items: inventory.mapItems() });
});

RegisterCommand(
  `additem`,
  async (playerId: number, args: [string]) => {
    const inventory = await GetInventory(playerId.toString(), `player`);
    console.log('additem', playerId, args[0], inventory);

    if (!inventory) return;

    const item = await CreateItem(args[0]);
    const success = item.move(inventory);

    console.log(success, item, item.icon);
  },
  false
);
