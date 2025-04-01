import type { BaseInventory } from '@common/inventory/class';
import type { InventoryItem } from '@common/item/index';
import { cache, triggerServerCallback } from '@overextended/ox_lib/client';
import './context';
import config from '@common/config';
import { Grid, type GridEntry } from '@common/grid';
import { Vector3 } from '@nativewrappers/common';
import vehicleClasses from '@static/vehicleClasses.json';
import { ValidateItemData } from './item';

export enum InventoryState {
  Closed = 0,
  Closing = 1,
  Open = 2,
  Busy = 3,
}

type InventoryGridEntry = GridEntry & { inventoryId: string; type: string; label: string };

export let inventoryState: InventoryState = InventoryState.Closed;
export const openInventories = new Map<string, BaseInventory>();

const grid = new Grid<InventoryGridEntry>();
let nearbyInventories: InventoryGridEntry[] = [];

function AddGridEntry(data: InventoryGridEntry) {
  data.width = 1;
  data.length = 1;

  grid.addEntry(data, 'inventoryId');
}

function RemoveGridEntry(inventoryId: string) {
  const entry = grid.getEntry(inventoryId);

  if (entry) grid.removeEntry(entry, 'inventoryId');
}

export function GetClosestInventory(type: string, distance: number = 1) {
  if (nearbyInventories.length === 0) return;

  const closest = nearbyInventories.reduce((acc, value) => {
    if (!type || type !== value.type) return acc;

    return value.distance < acc.distance ? value : acc;
  });

  return closest.distance <= distance && (!type || type === closest.type) ? closest.inventoryId : null;
}

export function GetNearbyInventories() {
  if (nearbyInventories.length === 0) return [];

  return nearbyInventories.filter((entry) => entry.distance <= 1).map((entry) => entry.inventoryId);
}

export async function OpenInventory(data: { inventory: BaseInventory; items: InventoryItem[]; playerId: number }) {
  data.playerId = cache.serverId;

  await Promise.all(data.items.map(ValidateItemData));

  if (data.inventory.coords) {
    data.inventory.coords = data.inventory.netId ? null : Vector3.fromObject(data.inventory.coords);
  }

  openInventories.set(data.inventory.inventoryId, data.inventory);

  SetNuiFocus(true, true);
  SendNUIMessage({
    action: 'openInventory',
    data: data,
  });
}

export function CloseInventory(data?: { inventoryId: string; inventoryCount: number }, cb?: NuiCb) {
  emitNet('ox_inventory:closeInventory', data?.inventoryId);

  if (data?.inventoryId) openInventories.delete(data.inventoryId);
  else openInventories.clear();

  SendNUIMessage({
    action: 'closeInventory',
    data: data?.inventoryId,
  });

  if (!data || !data.inventoryCount) {
    SetNuiFocus(false, false);
  }

  if (cb) cb(1);
}

export function OpenVehicleTrunk({ entity }: { entity: number }) {
  const netId = NetworkGetNetworkIdFromEntity(entity);

  const vehicleClass = vehicleClasses[GetVehicleClass(entity)];
  const configKey = `Vehicle_${vehicleClass}_Glovebox_Weight`;
  const hasTrunk = config[configKey as any];

  if (!hasTrunk) return;

  emitNet('ox_inventory:requestOpenInventory', [`trunk:${netId}`]);
}

RegisterNuiCallback('closeInventory', CloseInventory);

RegisterNuiCallback('getStateKeyValue', ([state, key]: [state: string, key: string], cb: (value: unknown) => void) => {
  const value = state === 'global' ? GlobalState[key] : LocalPlayer.state[key];

  cb(value);
});

RegisterNuiCallback('moveItem', async (data: MoveItem, cb: NuiCb) => {
  if (data.toType === 'drop' && !data.toId) {
    const nearestDrop = GetClosestInventory('drop');

    if (nearestDrop) {
      data.toId = nearestDrop;
      delete data.toSlot;
    } else data.coords = GetEntityCoords(cache.ped, true) as [number, number, number];
  }

  const response = await triggerServerCallback<boolean>('ox_inventory:requestMoveItem', 50, data);
  cb(response ? 1 : 0);
});

onNet('ox_inventory:openInventory', OpenInventory);

onNet('ox_inventory:closeInventory', CloseInventory);

onNet('ox_inventory:updateItem', async (...args: InventoryItem[]) => {
  await Promise.all(args.map(ValidateItemData));

  SendNUIMessage({
    action: 'updateItem',
    data: args,
  });
});

onNet('ox_inventory:clearInventory', (data: { inventoryId: string; keepItems?: number[] }) => {
  SendNUIMessage({
    action: 'clearInventory',
    data,
  });
});

onNet('ox_inventory:addInventoryGrid', (data: InventoryGridEntry | InventoryGridEntry[]) => {
  if (!Array.isArray(data)) return AddGridEntry(data);

  for (const inventory of data) AddGridEntry(inventory);
});

onNet('ox_inventory:removeInventoryGrid', RemoveGridEntry);

setInterval(() => {
  const playerCoords = cache.coords as Vector3;
  nearbyInventories = grid.getNearbyEntries(playerCoords);

  if (nearbyInventories.length) console.log('nearbyInventories', nearbyInventories.length);

  for (const entry of nearbyInventories) {
    entry.distance = playerCoords.distance(entry.coords);
  }

  for (const inventory of openInventories.values()) {
    let distance = 0;

    if (!inventory.coords && !inventory.netId) continue;

    if (inventory.netId) {
      if (!NetworkDoesEntityExistWithNetworkId(inventory.netId)) {
        distance = 100;
      } else {
        const entityId = NetworkGetEntityFromNetworkId(inventory.netId);
        const coords = Vector3.fromArray(GetEntityCoords(entityId, true));
        distance = playerCoords.distance(coords);
      }
    } else if (inventory.coords) {
      distance = playerCoords.distance(inventory.coords as Vector3);
    }

    if (distance > (inventory.radius || 10)) {
      CloseInventory({ inventoryId: inventory.inventoryId, inventoryCount: openInventories.size - 1 });
    }
  }
}, 500);

setTick(() => {
  for (const entry of nearbyInventories) {
    if (entry.distance > 50) continue;

    const { x, y, z } = entry.coords;

    DrawMarker(
      2,
      x,
      y,
      z,
      0,
      0,
      0,
      0,
      0,
      0,
      0.3,
      0.2,
      0.15,
      150,
      30,
      30,
      222,
      false,
      false,
      0,
      true,
      null,
      null,
      false,
    );
  }
});

exports('openVehicleTrunk', OpenVehicleTrunk);
