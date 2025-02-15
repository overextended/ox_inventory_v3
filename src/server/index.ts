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

onNet(`ox_inventory:requestMoveItem`, async (data: MoveItem) => {
  const fromInventory = await GetInventory(data.fromId, data.fromType);
  const toInventory = data.fromId === data.toId ? fromInventory : await GetInventory(data.toId, data.toType);

  if (!fromInventory || !toInventory) return console.error(`Invalid inventory`);

  const item = GetInventoryItem(fromInventory.items[data.fromSlot]);

  data.quantity = Math.max(1, Math.min(item.quantity, data.quantity));

  if (!item || data.quantity > item.quantity) return console.error(`Invalid item or item count`);

  data.quantity !== item.quantity
    ? item.split(toInventory, data.quantity, data.toSlot)
    : item.move(toInventory, data.toSlot);
});

RegisterCommand(
  `additem`,
  async (playerId: number, args: string[]) => {
    const inventory = await GetInventory(playerId.toString(), `player`);

    if (!inventory) return;

    await CreateItem(args[0], { inventoryId: inventory.inventoryId, quantity: Number(args[1]) || 1 });
  },
  false
);
