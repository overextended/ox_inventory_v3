import { Grid, type GridEntry } from '@common/grid';
import { Vector3 } from '@nativewrappers/fivem';
import { cache } from '@overextended/ox_lib';

type InventoryGridEntry = GridEntry & { inventoryId: string; type: string; label: string };

const grid = new Grid<InventoryGridEntry>();
let nearbyEntries: InventoryGridEntry[] = [];
let playerCoords: Vector3;

setInterval(() => {
  playerCoords = Vector3.fromArray(GetEntityCoords(cache.ped, true));
  nearbyEntries = grid.getNearbyEntries(playerCoords);

  for (const entry of nearbyEntries) {
    entry.distance = playerCoords.distance(entry.coords);
  }
}, 500);

// todo: peds, targets, whatever
// for now, it's just "points"
setTick(() => {
  for (const entry of nearbyEntries) {
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

function CreateDrop(data: InventoryGridEntry) {
  data.radius = 1;
  data.coords = Vector3.fromObject(data.coords);

  grid.addEntry(data, 'inventoryId');
}

onNet('ox_inventory:createDrop', (data: InventoryGridEntry | InventoryGridEntry[]) => {
  if (!Array.isArray(data)) return CreateDrop(data);

  for (const drop of data) CreateDrop(drop);
});

onNet('ox_inventory:removeDrop', (dropId: string) => {
  const entry = grid.getEntry(dropId);

  if (entry) grid.removeEntry(entry, 'inventoryId');
});

export function GetClosestInventory(type: string, distance: number = 1) {
  if (nearbyEntries.length === 0) return;

  const closest = nearbyEntries.reduce((acc, value) => {
    if (!type || type !== value.type) return acc;

    return value.distance < acc.distance ? value : acc;
  });

  return closest.distance <= distance && (!type || type === closest.type) ? closest.inventoryId : null;
}

export function GetNearbyInventories() {
  if (nearbyEntries.length === 0) return;

  return nearbyEntries.filter((entry) => entry.distance <= 1).map((entry) => entry.inventoryId);
}
