import { BaseInventory } from '@common/inventory/class';
import db from '../db';
import { Inventory } from './class';
import { CreateItem } from '../item';
import { GetPlayer } from '@overextended/ox_core/server';
import Config from '@common/config';

async function GetDefaultInventoryData(inventoryId: string, type: string) {
  const inventory: Partial<BaseInventory> = {
    inventoryId: inventoryId,
    ownerId: inventoryId,
    type,
  };

  switch (type) {
    case 'player':
      break;
    default:
      throw new Error(`invalid inventory type ${type}`);
  }

  db.insertInventory(inventory);

  return inventory;
}

export function GetInventory(inventoryId: string, data: string | Partial<Inventory>) {
  data = typeof data === 'string' ? { inventoryId, type: data } : { inventoryId, type: 'player', ...data };

  if (data.type === 'player' && typeof inventoryId === 'number') {
    const player = GetPlayer(inventoryId);

    if (!player) return console.error(`Cannot get inventory for invalid player ${inventoryId}`);

    data.playerId = +inventoryId;
    inventoryId = `player:${player.charId}`;
  }

  let inventory = Inventory.fromId(inventoryId);

  if (!inventory) {
    inventory = new Inventory({
      ...data,
      ...(data.type === 'drop'
        ? {
            inventoryId: inventoryId,
            label: `Drop ${+GetHashKey(inventoryId)}`,
            width: Config.Drop_Width,
            height: Config.Drop_Height,
            maxWeight: Config.Drop_MaxWeight,
          }
        : db.getInventory(inventoryId) || GetDefaultInventoryData(inventoryId, data.type)),
    });

    const items = db.getInventoryItems(inventory.inventoryId);

    for (const data of items) {
      const name = data.name;
      delete data.name;

      CreateItem(name, data);
    }
  }

  return inventory;
}
