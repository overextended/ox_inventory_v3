import Config from '@common/config';
import { GetPlayer } from '@overextended/ox_core/server';
import { triggerClientCallback } from '@overextended/ox_lib/server';
import vehicleClasses from '@static/vehicleClasses.json';
import db from '../db';
import { Inventory } from './class';

export async function GetInventory(inventoryId: string | number, data?: string | Partial<Inventory>) {
  data = typeof data === 'string' ? { type: data } : data || {};

  if (typeof inventoryId === 'number') {
    const player = GetPlayer(inventoryId);

    if (!player) return console.error(`Cannot get inventory for invalid player ${inventoryId}`);

    data.type = 'player';
    data.playerId = +inventoryId;
    inventoryId = `player:${player.charId}`;
  } else if (typeof inventoryId === 'string') {
    if (!data.type) {
      data.type = inventoryId.slice(0, inventoryId.indexOf(':'));
    } else if (!inventoryId.startsWith(data.type)) {
      inventoryId = `${data.type}:${inventoryId}`;
    }
  }

  const inventory = Inventory.FromId(inventoryId);

  if (inventory) return inventory;

  const result = !data.isTemporary && db.getInventory(inventoryId);
  data.inventoryId = inventoryId;

  if (!result) db.insertInventory(data);

  switch (data.type) {
    case 'player':
      break;
    case 'trunk':
    case 'glovebox': {
      const netId = +inventoryId.replace(`${data.type}:`, '');
      const entityId = NetworkGetEntityFromNetworkId(netId);
      const playerId = NetworkGetEntityOwner(entityId);
      const vClass = (await triggerClientCallback('ox_inventory:getVehicleClass', playerId, netId)) as number;
      const vehicleClass = vehicleClasses[vClass];

      console.log(vClass, vehicleClass);

      if (!vehicleClass) return;

      const label = data.type === 'trunk' ? 'Trunk' : 'Glovebox';
      const configKey = `Vehicle_${vehicleClass}_${label}`;
      data.height = Config[`${configKey}_Height` as any];
      data.width = Config[`${configKey}_Width` as any];
      data.weight = Config[`${configKey}_Weight` as any];
      data.label = `${label} - ${GetVehicleNumberPlateText(entityId).trim()}`;
      data.netId = netId;
      break;
    }
    case 'drop':
      data.label = `Drop ${+GetHashKey(inventoryId)}`;
      data.width = Config.Drop_Width;
      data.height = Config.Drop_Height;
      data.maxWeight = Config.Drop_MaxWeight;
      data.isTemporary = true;
      break;
    default:
      throw new Error(`Invalid inventory type ${inventory.type} for id ${inventory.inventoryId}`);
  }

  return new Inventory(Object.assign(data, result));
}
