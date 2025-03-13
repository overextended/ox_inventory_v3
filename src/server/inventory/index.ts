import db from '../db';
import { Inventory } from './class';
import { CreateItem } from '../item';
import { GetPlayer } from '@overextended/ox_core/server';
import Config from '@common/config';

export function GetInventory(inventoryId: string | number, data?: string | Partial<Inventory>) {
  let inventory = typeof inventoryId === 'string' && Inventory.FromId(inventoryId);

  if (inventory) return inventory;

  data = typeof data === 'string' ? { type: data } : data || { type: 'player' };

  if (typeof inventoryId === 'number') {
    const player = GetPlayer(inventoryId);

    if (!player) return console.error(`Cannot get inventory for invalid player ${inventoryId}`);

    data.playerId = +inventoryId;
    inventoryId = `player:${player.charId}`;

    inventory = Inventory.FromId(inventoryId);

    if (inventory) return inventory;
  }

  data.inventoryId = inventoryId;

  switch (data.type) {
    case 'player':
      break;
    case 'trunk':
    case 'glovebox':
      // todo
      break;
    case 'drop':
      data.label = `Drop ${+GetHashKey(data.inventoryId)}`;
      data.width = Config.Drop_Width;
      data.height = Config.Drop_Height;
      data.maxWeight = Config.Drop_MaxWeight;
      break;
    default:
      throw new Error(`Invalid inventory type ${inventory.type} for id ${inventory.inventoryId}`);
  }

  const result = db.getInventory(data.inventoryId);

  if (!result) db.insertInventory(data);

  inventory = new Inventory(Object.assign(data, result));

  const items = db.getInventoryItems(inventory.inventoryId);

  for (const data of items) {
    CreateItem(data);
  }

  return inventory;
}
