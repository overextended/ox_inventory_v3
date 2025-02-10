import { BaseInventory } from '@common/inventory/class';
import { GetDbInventoryData, InsertDbInventoryData } from '../db';
import { Inventory } from './class';
import { CreateItem } from '../item';
import { GetPlayer } from '@overextended/ox_core/server';
import { GetInventoryItems } from '../kvp';

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

export async function GetInventory(inventoryId: string, type: string) {
  if (type === 'player' && !inventoryId.includes(`player`)) {
    const player = GetPlayer(inventoryId);
    inventoryId = `player:${player.charId.toString()}`;
  }

  let inventory = Inventory.fromId(inventoryId);

  if (!inventory) {
    const data = (await GetDbInventoryData(inventoryId)) || (await GetDefaultInventoryData(inventoryId, type));
    const items = GetInventoryItems(inventoryId);

    inventory = new Inventory(data);

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
