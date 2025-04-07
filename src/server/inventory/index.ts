import Config from '@common/config';
import { triggerClientCallback } from '@overextended/ox_lib/server';
import vehicleClasses from '@static/vehicleClasses.json';
import { GetPlayerInventoryId, GetVehicleFromInventoryId } from '../bridge';
import { Inventory } from './class';

export async function GetInventory(inventoryId: string | number, data: Partial<Inventory> = {}) {
  const inventoryType = typeof inventoryId === 'number' ? 'player' : inventoryId.slice(0, inventoryId.indexOf(':'));

  if (typeof inventoryId === 'number') {
    inventoryId = GetPlayerInventoryId(inventoryId);
  }

  const inventory = Inventory.FromId(inventoryId);

  if (inventory) return inventory;

  switch (inventoryType) {
    case 'player':
      break;
    case 'trunk':
    case 'glovebox': {
      const [netId, entityId, vin, isTemporary] = GetVehicleFromInventoryId(inventoryId);

      if (!netId) return;

      inventoryId = `${inventoryType}:${vin}`;
      const inventory = Inventory.FromId(inventoryId);

      if (inventory) return inventory;

      const playerId = NetworkGetEntityOwner(entityId);
      const vClass = (await triggerClientCallback('ox_inventory:getVehicleClass', playerId, netId)) as number;
      const vehicleClass = vehicleClasses[vClass];
      const label = inventoryType === 'trunk' ? 'Trunk' : 'Glovebox';
      const configKey = `Vehicle_${vehicleClass}_${label}`;

      data.height = Config[`${configKey}_Height` as any];
      data.width = Config[`${configKey}_Width` as any];
      data.weight = Config[`${configKey}_Weight` as any];
      data.label = `${label} - ${GetVehicleNumberPlateText(entityId).trim()}`;
      data.netId = netId;
      data.entityId = entityId;

      if (isTemporary) data.isTemporary = true;

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
      throw new Error(`Invalid inventory type ${inventoryType} for id ${inventoryId}`);
  }

  data.inventoryId = inventoryId;
  data.type = inventoryType;

  if (data.entityId) {
    Entity(data.entityId).state.inventoryId = data.inventoryId;
  }

  return new Inventory(data);
}
