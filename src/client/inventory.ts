import type { BaseInventory } from '@common/inventory/class';
import type { InventoryItem } from '@common/item/index';
import { cache, requestAnimDict, sleep, triggerServerCallback, waitFor } from '@overextended/ox_lib/client';
import './context';
import config from '@common/config';
import { Grid, type GridEntry } from '@common/grid';
import locale from '@common/locale';
import { Vector2, Vector3 } from '@nativewrappers/common';
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

export async function RequestOpenInventory(inventories: (string | number)[] = []) {
  if (!CanAccessInventory()) return false;

  inventories = [...inventories, ...GetNearbyInventories()];

  const { vehicle, seat } = cache;

  if (vehicle && seat && seat < 2) {
    const vehicleClass = vehicleClasses[GetVehicleClass(vehicle)];
    const configKey = `Vehicle_${vehicleClass}_Glovebox_Weight`;
    const hasGlovebox = config[configKey as any];

    if (hasGlovebox) {
      inventories.push(`glovebox:${NetworkGetNetworkIdFromEntity(vehicle)}`);
    }
  }

  await triggerServerCallback('ox_inventory:requestOpenInventory', 100, inventories);

  return true;
}

export async function OpenVehicleTrunk({ entity }: { entity: number }) {
  const netId = NetworkGetNetworkIdFromEntity(entity);
  const vehicleClass = vehicleClasses[GetVehicleClass(entity)];
  const configKey = `Vehicle_${vehicleClass}_Glovebox_Weight`;
  const hasTrunk = config[configKey as any];

  if (!hasTrunk) return false;

  const { doorIndex, isRearEngine } = GetVehicleTrunkData(entity) || {};

  if (!doorIndex) return false;

  const vehicleHash = GetEntityModel(entity);
  let [min, max] = GetModelDimensions(vehicleHash) as (number[] | Vector3)[];
  min = Vector3.fromArray(min as number[]);
  max = Vector3.fromArray(max as number[]);

  const offset = max
    .subtract(min)
    .multiply(new Vector3(0.5, isRearEngine ? 1.1 : -0.1, 0.5))
    .add(min);

  const goto = Vector2.fromArray(GetOffsetFromEntityInWorldCoords(entity, offset.x, offset.y, offset.z));

  TaskGotoEntityOffsetXy(cache.ped, entity, 4000, 0, offset.x, offset.y, 2.0, 1);

  const success = await waitFor(
    () => {
      const coords = Vector2.fromArray(GetEntityCoords(cache.ped, true));
      const distance = goto.subtract(coords).Length;

      if (distance <= 0.5) return true;
    },
    '',
    4000,
  ).catch(() => false);

  if (!success) return false;

  const state = Entity(entity).state;
  let inventoryId = state.inventoryId || `trunk:${netId}`;

  await RequestOpenInventory([inventoryId]);

  inventoryId = Entity(entity).state.inventoryId;

  if (!openInventories.has(inventoryId)) return false;

  const anim = await requestAnimDict('anim@heists@prison_heiststation@cop_reactions');
  const anim2 = await requestAnimDict('anim@heists@fleeca_bank@scope_out@return_case');

  RemoveAnimDict(anim);
  TaskPlayAnim(cache.ped, anim, 'cop_b_idle', 3, 3, -1, 49, 0, false, false, false);
  SetVehicleDoorOpen(entity, doorIndex, false, false);

  const interval = setInterval(() => {
    InvalidateIdleCam();
    SetVehicleDoorOpen(entity, doorIndex, false, false);
  }, 500);

  await waitFor(() => (openInventories.has(inventoryId) ? undefined : true), '', false);

  TaskPlayAnim(cache.ped, anim2, 'trevor_action', 2.0, 2.0, 1000, 49, 0.25, false, false, false);

  await sleep(900);

  SetVehicleDoorShut(entity, doorIndex, false);
  clearInterval(interval);
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

export function CanAccessInventory(inventory?: BaseInventory) {
  if (
    !IsPlayerControlOn(cache.playerId) ||
    IsPedFatallyInjured(cache.ped) ||
    IsPedCuffed(cache.ped) ||
    IsPauseMenuActive() ||
    GetPedConfigFlag(cache.ped, 180, true)
  )
    return false;

  if (!inventory) return true;

  const playerCoords = cache.coords as Vector3;
  let distance = 0;

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

  if (distance > (inventory.radius || 10)) return false;

  return true;
}

function GetVehicleTrunkData(entity: number) {
  const vehicleClass = vehicleClasses[GetVehicleClass(entity)];
  const configKey = `Vehicle_${vehicleClass}_Trunk_Weight`;

  if (!config[configKey as any]) return null;

  const engineBone = GetEntityBoneIndexByName(entity, 'engine');

  if (engineBone === -1) return null;

  const enginePosition = Vector3.fromArray(GetEntityBonePosition_2(entity, engineBone));
  const rearOffset = Vector3.fromArray(GetOffsetFromEntityInWorldCoords(entity, 0.5, 0, 0.5));
  const frontOffset = Vector3.fromArray(GetOffsetFromEntityInWorldCoords(entity, 0.5, 1, 0.5));
  const isRearEngine = enginePosition.subtract(rearOffset).Length < enginePosition.subtract(frontOffset).Length;
  let bootBone = GetEntityBoneIndexByName(entity, 'boot');

  if (bootBone === -1) {
    bootBone = GetEntityBoneIndexByName(entity, 'bonnet');
    const bootPosition = Vector3.fromArray(GetEntityBonePosition_2(entity, bootBone));
    const isRearBoot = bootPosition.subtract(rearOffset).Length < bootPosition.subtract(frontOffset).Length;

    if (isRearBoot) return null;
  }

  const doorIndex = isRearEngine ? 4 : 5;
  const lockStatus = GetVehicleIndividualDoorLockStatus(entity, doorIndex);

  if ((lockStatus > 1 && lockStatus !== 8) || !GetIsDoorValid(entity, doorIndex)) return null;

  return { doorIndex, isRearEngine };
}

setInterval(() => {
  const playerCoords = cache.coords as Vector3;
  nearbyInventories = grid.getNearbyEntries(playerCoords);

  if (nearbyInventories.length) console.log('nearbyInventories', nearbyInventories.length);

  for (const entry of nearbyInventories) {
    entry.distance = playerCoords.distance(entry.coords);
  }

  for (const inventory of openInventories.values()) {
    if (!CanAccessInventory(inventory)) {
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
exports('requestOpenInventory', RequestOpenInventory);

if (GetResourceState('ox_target') === 'started') {
  exports.ox_target.addGlobalPlayer({
    label: locale('access_inventory'),
    icon: 'fas fa-search',
    onSelect: ({ entity }: { entity: number }) => {
      const targetId = GetPlayerServerId(NetworkGetEntityOwner(entity));

      RequestOpenInventory([targetId]);
    },
  });

  exports.ox_target.addGlobalVehicle({
    label: locale('access_inventory'),
    icon: 'fas fa-truck-ramp-box',
    export: 'openVehicleTrunk',
    canInteract: (entity: number) => Entity(entity).state.inventoryId || !!GetVehicleTrunkData(entity),
    distance: 3,
  });
}
