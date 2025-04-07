import { GetPlayer, GetVehicleFromNetId, GetVehicleFromVin } from '@overextended/ox_core/server';

export let GetPlayerInventoryId = (id: number) => {
  const player = GetPlayer(id);

  if (!player) throw new Error(`Cannot get inventory for invalid player ${id}`);

  return `player:${player.charId}`;
};

export let GetVehicleFromInventoryId = (inventoryId: string) => {
  const id = inventoryId.slice(inventoryId.indexOf(':') + 1);

  const vehicle = +id ? GetVehicleFromNetId(+id) : GetVehicleFromVin(id);

  if (!vehicle) return [+id, NetworkGetEntityFromNetworkId(+id), +id, true] as const;

  const isTemporary = !vehicle.id;

  return [vehicle.netId, vehicle.entity, vehicle.vin, isTemporary] as const;
};

exports('setBridgeMethod', (name: string, method: any) => {
  if (typeof method !== 'function') throw new Error(`Cannot set method ${name} to a non-function value`);

  switch (name) {
    case 'GetPlayerInventoryId':
      return (GetPlayerInventoryId = method);
    case 'GetVehicleFromInventoryId':
      return (GetVehicleFromInventoryId = method);
  }
});
