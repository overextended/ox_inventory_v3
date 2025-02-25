import { GetInventoryItem } from '@common/item';
import { GetInventory } from './inventory';
import { CreateItem } from './item';
import { onClientCallback } from '@overextended/ox_lib/server';
import { Inventory } from './inventory/class';

onNet(`ox_inventory:requestOpenInventory`, async (nearbyInventories: string[]) => {
  const playerId = source;
  const inventory = await GetInventory(playerId.toString(), `player`);

  if (inventory) inventory.open(playerId);

  nearbyInventories.forEach((inventoryId) => {
    const nearbyInventory = Inventory.fromId(inventoryId);

    // todo: validation
    if (nearbyInventory) nearbyInventory.open(playerId);
  });
});

onNet(`ox_inventory:closeInventory`, async (inventoryId?: string) => {
  const playerId = source;

  if (inventoryId) return Inventory.fromId(inventoryId)?.close(playerId, false);

  Inventory.getInventories(playerId).forEach((inventory) => inventory.close(playerId, false));
});

onClientCallback(`ox_inventory:requestMoveItem`, async (playerId, data: MoveItem) => {
  const fromInventory = await GetInventory(data.fromId, data.fromType);
  const toInventory =
    data.fromId === data.toId
      ? fromInventory
      : await GetInventory(data.toId ?? Date.now().toString(), { type: data.toType, coords: data.coords });

  if (!fromInventory || !toInventory) return console.error(`Invalid inventory`);

  const item = GetInventoryItem(fromInventory.items[data.fromSlot]);

  if (!item) return console.error(`Invalid item in ${fromInventory.inventoryId}<${data.fromSlot}>`);

  data.quantity = Math.max(1, Math.min(item.quantity, data.quantity));

  if (data.quantity > item.quantity) return console.error(`Invalid item or item count`);

  item.tempRotate = data.rotate;

  const success =
    data.quantity !== item.quantity
      ? item.split(toInventory, data.quantity, data.toSlot)
      : item.move(toInventory, data.toSlot);

  if (success) toInventory.open(playerId);

  return !!success;
});

RegisterCommand(
  `additem`,
  (playerId: number, args: string[]) => {
    const inventory = GetInventory(playerId.toString(), `player`);

    if (!inventory) return;

    CreateItem(args[0], { inventoryId: inventory.inventoryId, quantity: Number(args[1]) || 1 });
  },
  false
);
