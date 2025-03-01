import type { ItemProperties } from '@common/item/index';
import { triggerServerCallback } from '@overextended/ox_lib/client';
import { CurrentWeapon, DisarmWeapon, EquipWeapon, LoadAmmo } from './weapon';

export async function UseItem(itemId: number) {
  const response = await triggerServerCallback<ItemProperties>('ox_inventory:requestUseItem', 50, itemId);

  if (!response) return;

  const item = Object.assign(GlobalState[`Item:${response.name}`], response);

  console.log('Using item', item);

  switch (item.category) {
    case 'ammo':
      return LoadAmmo(item);
    case 'weapon':
      return CurrentWeapon.uniqueId === item.uniqueId ? DisarmWeapon() : EquipWeapon(item);
  }
}
