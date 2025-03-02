import Config from '@common/config';
import type { ItemProperties, WeaponMetadata } from '@common/item';
import { ClearObject } from '@common/utils';
import { cache } from '@overextended/ox_lib';

const SuppressPickupRewardType = N_0xf92099527db8e2a7;
const ClearPickupRewardTypeSuppression = N_0x762db2d380b48d04;
const pickups = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 7) | (1 << 10);
let weaponWheel = false;

setTick(() => {
  if (weaponWheel) return;

  HudWeaponWheelIgnoreSelection();
  DisableControlAction(0, 37, true);
});

export function SetWeaponWheelState(disabled = Config.Weapon_Enabled) {
  weaponWheel = !disabled;

  SetWeaponsNoAutoswap(disabled);
  SetWeaponsNoAutoreload(disabled);

  if (disabled) return SuppressPickupRewardType(pickups, 1);

  ClearPickupRewardTypeSuppression(pickups);
}

export const CurrentWeapon = {} as ItemProperties & WeaponMetadata;

export function EquipWeapon(item: ItemProperties) {
  if (item.category !== 'weapon') return;

  // todo: animations

  Object.assign(CurrentWeapon, item);
  CurrentWeapon.group = GetWeapontypeGroup(CurrentWeapon.hash);

  GiveWeaponToPed(cache.ped, CurrentWeapon.hash, 0, false, true);

  // todo: support weapon components, tints, special ammo

  SetCurrentPedWeapon(cache.ped, CurrentWeapon.hash, true);
  SetPedCurrentWeaponVisible(cache.ped, true, false, false, false);
  SetWeaponsNoAutoswap(true);
  SetPedAmmo(cache.ped, CurrentWeapon.hash, CurrentWeapon.ammoCount);

  setTimeout(() => RefillAmmoInstantly(cache.ped));
}

export function DisarmWeapon() {
  if (!CurrentWeapon.name) return;

  // todo: animations

  SetWeaponWheelState();
  SetPedAmmo(cache.ped, CurrentWeapon.hash, 0);
  RemoveAllPedWeapons(cache.ped, true);
  ClearObject(CurrentWeapon);

  // todo: return parachute to player
}

export function LoadAmmo(item: ItemProperties) {
  if (CurrentWeapon.ammoName !== item.name) return;

  let clipSize = GetMaxAmmoInClip(cache.ped, CurrentWeapon.hash, true);
  const currentAmmo = GetAmmoInPedWeapon(cache.ped, CurrentWeapon.hash);
  const [_, maxAmmo] = GetMaxAmmo(cache.ped, CurrentWeapon.hash);

  if (maxAmmo < clipSize) clipSize = maxAmmo;
  if (currentAmmo === clipSize) return;
  if (maxAmmo > clipSize) clipSize = GetMaxAmmoInClip(cache.ped, CurrentWeapon.hash, true);

  const missingAmmo = clipSize - currentAmmo;
  const addAmmo = item.quantity > missingAmmo ? missingAmmo : item.quantity;
  const newAmmo = currentAmmo + addAmmo;

  if (currentAmmo === newAmmo) return;

  AddAmmoToPed(cache.ped, CurrentWeapon.hash, addAmmo);
  emitNet('ox_inventory:updateWeaponAmmo', addAmmo);
}
