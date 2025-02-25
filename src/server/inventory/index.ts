import { BaseInventory } from '@common/inventory/class';
import { GetDbInventoryData, InsertDbInventoryData } from '../db';
import { Inventory } from './class';
import { CreateItem } from '../item';
import { GetPlayer } from '@overextended/ox_core/server';
import { GetInventoryItems } from '../kvp';
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

  await InsertDbInventoryData(inventory);

  return inventory;
}

export async function GetInventory(inventoryId: string, data: string | Partial<Inventory>) {
  data = typeof data === 'string' ? { inventoryId, type: data } : { inventoryId, type: 'player', ...data };

  if (data.type === 'player' && typeof inventoryId === 'number') {
    const player = GetPlayer(inventoryId);

    if (!player) return console.error(`Cannot get inventory for invalid player ${inventoryId}`);

    data.playerId = +inventoryId;
    inventoryId = `player:${player.charId}`;
  }

  let inventory = Inventory.fromId(inventoryId);

  if (!inventory) {
    const items = GetInventoryItems(inventoryId);

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
        : (await GetDbInventoryData(inventoryId)) || (await GetDefaultInventoryData(inventoryId, data.type))),
    });

    for (const data of items) {
      const name = data.name;
      const metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
      delete data.metadata;
      delete (data as any).name; // todo: fix typing :(

      await CreateItem(name, Object.assign(data, metadata));
    }
  }

  return inventory;
}
