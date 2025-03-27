import { GetInventoryItem, type ItemProperties, type Weapon } from '@common/item';
import { onClientCallback } from '@overextended/ox_lib/server';
import { GetInventory } from './inventory';
import { Inventory } from './inventory/class';
import './commands';
import Config from '@common/config';

onNet('ox_inventory:requestOpenInventory', async (inventories?: string[]) => {
  const playerId = source;
  const inventory = GetInventory(playerId, 'player');

  if (!inventory) return;

  inventory.open(playerId);

  if (!inventories || !inventories.length) return;

  for (const inventoryId of inventories) {
    const secondary = GetInventory(inventoryId);

    // todo: validation
    if (secondary) secondary.open(playerId);
  }
});

onNet('ox_inventory:closeInventory', async (inventoryId?: string) => {
  const playerId = source;

  if (inventoryId) return Inventory.FromId(inventoryId)?.close(playerId, false);

  Inventory.GetInventories(playerId).forEach((inventory) => inventory.close(playerId, false));
});

onClientCallback('ox_inventory:requestMoveItem', async (playerId, data: MoveItem) => {
  const fromInventory = GetInventory(data.fromId, data.fromType);
  const toInventory =
    data.fromId === data.toId
      ? fromInventory
      : GetInventory(data.toId ?? Date.now().toString(), { type: data.toType, coords: data.coords });

  if (!fromInventory || !toInventory) return console.error('Invalid·inventory');

  const item = GetInventoryItem(fromInventory.items[data.fromSlot]);

  if (!item) return console.error(`Invalid item in ${fromInventory.inventoryId}<${data.fromSlot}>`);

  data.quantity = Math.max(1, Math.min(item.quantity, data.quantity));

  if (data.quantity > item.quantity) return console.error('Invalid item or item count');

  item.tempRotate = data.rotate;

  const success =
    data.quantity !== item.quantity
      ? item.split(toInventory, data.quantity, data.toSlot)
      : item.move(toInventory, data.toSlot);

  if (success) toInventory.open(playerId);

  return !!success;
});

onClientCallback('ox_inventory:requestUseItem', async (playerId, itemId: number) => {
  const inventory = GetInventory(playerId);
  const item = inventory && GetInventoryItem(itemId);

  if (!item) return ['invalid_item'];
  if (!inventory || inventory.inventoryId !== item.inventoryId) return ['invalid_inventory'];

  switch (item.category) {
    case 'weapon':
      inventory.currentWeapon = item.uniqueId;
      break;
    case 'ammo':
      if (!GetInventoryItem(inventory.currentWeapon)) return;

      break;
  }

  return item;
});

onClientCallback('ox_inventory:getInventoryItem', async (playerId, itemId: number) => {
  return GetInventoryItem(itemId);
});

onClientCallback('ox_inventory:findInventoryItem', async (playerId, data: ItemProperties) => {
  const inventory = GetInventory(playerId);

  if (!inventory) return;

  return inventory.mapItems().find((item) => item.match(data, false));
});

onNet('ox_inventory:updateWeapon', (ammoCount: number, durability: number) => {
  const playerId = source;
  const inventory = GetInventory(playerId);
  const weapon = inventory && (GetInventoryItem(inventory.currentWeapon) as Weapon);

  if (!weapon || ammoCount > weapon.ammoCount || durability > weapon.durability) return;

  if (weapon.ammoName) weapon.ammoCount = ammoCount;

  weapon.durability = durability;

  // placeholder for syncing weapon
  weapon.move(inventory, weapon.anchorSlot);
  emitNet('ox_inventory:updateCurrentWeapon', playerId, weapon);

  if (Config.Weapon_AutoReload && ammoCount === 0) {
    const item = inventory.mapItems().find((item) => item.name === weapon.ammoName);

    if (item) emitNet('ox_inventory:useItem', playerId, item.uniqueId);
  }
});

onNet('ox_inventory:loadWeaponAmmo', (addAmmo: number) => {
  const playerId = source;
  const inventory = GetInventory(playerId);
  const weapon = inventory && GetInventoryItem(inventory.currentWeapon);

  if (!weapon || typeof weapon.ammoName !== 'string') return;

  const success = inventory.removeItem({ name: weapon.ammoName, quantity: addAmmo });

  if (!success) return;

  (weapon.ammoCount as number) += addAmmo;

  // placeholder for syncing ammo count
  weapon.move(inventory, weapon.anchorSlot);
  emitNet('ox_inventory:updateCurrentWeapon', playerId, weapon);
});
