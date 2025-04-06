import { GetInventoryItem, type ItemProperties, type Weapon } from '@common/item';
import { onClientCallback } from '@overextended/ox_lib/server';
import { GetInventory } from './inventory';
import { Inventory } from './inventory/class';
import './commands';
import Config from '@common/config';
import { TriggerEventHooks } from '@common/hooks';

onClientCallback('ox_inventory:requestOpenInventory', async (playerId, inventories?: string[]) => {
  const inventory = await GetInventory(playerId, 'player');

  if (!inventory) return false;

  using hook = await TriggerEventHooks('openInventory', {
    playerId,
    inventoryId: inventory.inventoryId,
    inventoryType: inventory.type,
  });

  if (!hook.success) return console.error('Cannot open inventory');

  inventory.open(playerId);

  if (!inventories || !inventories.length) return true;

  if (inventories.length > 5) inventories.length = 5;

  for (const inventoryId of inventories) {
    const secondary = await GetInventory(inventoryId);

    // todo: validation
    if (secondary) {
      using secondaryHook = await TriggerEventHooks('openInventory', {
        playerId,
        inventoryId: secondary.inventoryId,
        inventoryType: secondary.type,
      });

      if (secondaryHook.success) secondary.open(playerId);
    }
  }

  return true;
});

onNet('ox_inventory:closeInventory', async (inventoryId?: string) => {
  const playerId = source;

  if (inventoryId) return Inventory.FromId(inventoryId)?.close(playerId, false);

  Inventory.GetInventories(playerId).forEach((inventory) => inventory.close(playerId, false));
});

onClientCallback('ox_inventory:requestMoveItem', async (playerId, data: MoveItem) => {
  const fromInventory = await GetInventory(data.fromId, data.fromType);
  const toInventory =
    data.fromId === data.toId
      ? fromInventory
      : await GetInventory(data.toId ?? Date.now().toString(), { type: data.toType, coords: data.coords });

  if (!fromInventory || !toInventory) return console.error('Invalid·inventory');

  const item = GetInventoryItem(fromInventory.items[data.fromSlot]);

  if (!item) return console.error(`Invalid item in ${fromInventory.inventoryId}<${data.fromSlot}>`);

  data.quantity = Math.max(1, Math.min(item.quantity, data.quantity));

  if (data.quantity > item.quantity) return console.error('Invalid item or item count');

  const canHoldItem = toInventory.canHoldItem(item, data.toSlot, data.quantity);

  if (!canHoldItem) return console.error('Cannot hold item');

  const splitStack = data.quantity !== item.quantity;

  using hook = await TriggerEventHooks('moveItem', {
    item,
    playerId,
    splitStack,
    toSlot: data.toSlot,
    quantity: data.quantity,
    inventoryId: fromInventory.inventoryId,
    inventoryType: fromInventory.type,
    toInventoryId: toInventory.inventoryId,
    toInventoryType: toInventory.type,
  });

  if (!hook.success) return console.error('Cannot move item');

  const success = splitStack
    ? item.split(toInventory, data.quantity, data.toSlot, data.rotate)
    : item.move(toInventory, data.toSlot, data.rotate);

  hook.success = !!success;

  return !!success;
});

onClientCallback('ox_inventory:requestUseItem', async (playerId, itemId: number) => {
  const inventory = await GetInventory(playerId);
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
  const inventory = await GetInventory(playerId);

  if (!inventory) return;

  return inventory.mapItems().find((item) => item.match(data, false));
});

onNet('ox_inventory:updateWeapon', async (ammoCount: number, durability: number) => {
  const playerId = source;
  const inventory = await GetInventory(playerId);
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

onNet('ox_inventory:loadWeaponAmmo', async (addAmmo: number) => {
  const playerId = source;
  const inventory = await GetInventory(playerId);
  const weapon = inventory && GetInventoryItem(inventory.currentWeapon);

  if (!weapon || typeof weapon.ammoName !== 'string') return;

  const success = inventory.removeItem({ name: weapon.ammoName, quantity: addAmmo });

  if (!success) return;

  (weapon.ammoCount as number) += addAmmo;

  // placeholder for syncing ammo count
  weapon.move(inventory, weapon.anchorSlot);
  emitNet('ox_inventory:updateCurrentWeapon', playerId, weapon);
});
