import type { Clothing, ItemProperties, Weapon } from '@common/item/index';
import { triggerServerCallback } from '@overextended/ox_lib/client';
import { GetClothingLabel, UseClothing } from './clothing';
import { RequestOpenInventory } from './inventory';
import { DisarmWeapon, EquipWeapon, LoadAmmo, currentWeapon } from './weapon';

function GetItemData(item: ItemProperties): ItemProperties {
  return Object.assign(GlobalState[`Item:${item.name}`], item);
}

export async function ValidateItemData(item: ItemProperties) {
  if (item.category === 'clothing') {
    if (item.name === item.label) {
      const label = await GetClothingLabel(item as Clothing);
      item.label = label || item.name;
    }
    return;
  }
}

export let isUsingItem = false;

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
  try {
    isUsingItem = true;
    const response = await triggerServerCallback<ItemProperties | [string]>('ox_inventory:requestUseItem', 50, itemId);

    if (!response) return;

    if (Array.isArray(response)) throw new Error(`requestUseItem failed: ${response}`);

    const item = GetItemData(response);

    switch (item.category) {
      case 'ammo':
        return await LoadAmmo(item);
      case 'weapon':
        return await (currentWeapon.uniqueId === item.uniqueId ? DisarmWeapon() : EquipWeapon(item as Weapon));
      case 'clothing':
        return await UseClothing(item as Clothing);
      case 'container':
        return await RequestOpenInventory([`container:${item.uniqueId}`]);
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    isUsingItem = false;
  }
}

onNet('ox_inventory:useItem', UseItem);
