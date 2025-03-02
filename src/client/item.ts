import type { ItemProperties } from '@common/item/index';
import { triggerServerCallback } from '@overextended/ox_lib/client';
import { CurrentWeapon, DisarmWeapon, EquipWeapon, LoadAmmo } from './weapon';

function GetItemData(item: ItemProperties): ItemProperties {
  return Object.assign(GlobalState[`Item:${item.name}`], item);
}

export async function GetInventoryItem(itemId: number) {
  const response = await triggerServerCallback<ItemProperties | [string]>(
    'ox_inventory:getInventoryItem',
    null,
    itemId,
  );

  if (!response) return;

  if (Array.isArray(response)) throw new Error(`requestUseItem failed: ${response}`);

  return GetItemData(response);
}

export async function UseItem(itemId: number) {
  const response = await triggerServerCallback<ItemProperties | [string]>('ox_inventory:requestUseItem', 50, itemId);

  if (!response) return;

  if (Array.isArray(response)) throw new Error(`requestUseItem failed: ${response}`);

  const item = GetItemData(response);

  console.log('Using item', item);

  switch (item.category) {
    case 'ammo':
      return LoadAmmo(item);
    case 'weapon':
      return CurrentWeapon.uniqueId === item.uniqueId ? DisarmWeapon() : EquipWeapon(item);
  }
}
