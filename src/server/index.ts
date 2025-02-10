import { GetInventoryItem } from '@common/item';
import { GetInventory } from './inventory';
import { CreateItem } from './item';
import './kvp';

onNet(`ox_inventory:requestOpenInventory`, async () => {
  const playerId = source;
  const inventory = await GetInventory(playerId.toString(), `player`);

  if (!inventory) return;

  inventory.open(playerId);
});

onNet(`ox_inventory:requestMoveItem`, async (data: any) => {
  const from = await GetInventory(data.fromId, data.fromType);
  const item = GetInventoryItem(from?.items[data.fromSlot]);

  console.log(data);

  if (!item || !from) return;

  item.move(from, data.toSlot);
});

RegisterCommand(
  `additem`,
  async (playerId: number, args: [string]) => {
    const inventory = await GetInventory(playerId.toString(), `player`);

    if (!inventory) return;

    await CreateItem(args[0], { inventoryId: inventory.inventoryId });
  },
  false
);
