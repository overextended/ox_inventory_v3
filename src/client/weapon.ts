import Config from '@common/config';
import type { ItemProperties, Weapon, WeaponMetadata } from '@common/item';
import { ClearObject } from '@common/utils';
import { cache, sleep, waitFor } from '@overextended/ox_lib';

const SuppressPickupRewardType = N_0xf92099527db8e2a7;
const ClearPickupRewardTypeSuppression = N_0x762db2d380b48d04;
const pickups = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 7) | (1 << 10);
export let weaponWheelEnabled = false;

export function SetweaponWheelEnabledState(disabled = Config.Weapon_Enabled) {
  weaponWheelEnabled = !disabled;

  SetWeaponsNoAutoswap(disabled);
  SetWeaponsNoAutoreload(disabled);

  if (disabled) return SuppressPickupRewardType(pickups, 1);

  ClearPickupRewardTypeSuppression(pickups);
}

export const currentWeapon = {} as Weapon & { group: number; timer: number; isMelee: boolean; shotDelay: number };

export function EquipWeapon(item: ItemProperties) {
  if (item.category !== 'weapon') return;

  // todo: animations

  Object.assign(currentWeapon, item);
  currentWeapon.group = GetWeapontypeGroup(currentWeapon.hash);
  currentWeapon.timer = 0;
  currentWeapon.isMelee = false;
  currentWeapon.shotDelay = GetWeaponTimeBetweenShots(currentWeapon.hash);

  GiveWeaponToPed(cache.ped, currentWeapon.hash, 0, false, true);

  // todo: support weapon components, tints, special ammo

  SetCurrentPedWeapon(cache.ped, currentWeapon.hash, true);
  SetPedCurrentWeaponVisible(cache.ped, true, false, false, false);
  SetWeaponsNoAutoswap(true);
  SetPedAmmo(cache.ped, currentWeapon.hash, currentWeapon.ammoCount);

  setTimeout(() => RefillAmmoInstantly(cache.ped));
}

export function DisarmWeapon() {
  if (!currentWeapon.name) return;

  // todo: animations

  SetweaponWheelEnabledState();
  SetPedAmmo(cache.ped, currentWeapon.hash, 0);
  RemoveAllPedWeapons(cache.ped, true);
  ClearObject(currentWeapon);

  // todo: return parachute to player
}

export async function LoadAmmo(item: ItemProperties) {
  if (currentWeapon.ammoName !== item.name) return;

  let clipSize = GetMaxAmmoInClip(cache.ped, currentWeapon.hash, true);
  const currentAmmo = GetAmmoInPedWeapon(cache.ped, currentWeapon.hash);
  const [_, maxAmmo] = GetMaxAmmo(cache.ped, currentWeapon.hash);

  if (maxAmmo < clipSize) clipSize = maxAmmo;
  if (currentAmmo === clipSize) return;
  if (maxAmmo > clipSize) clipSize = GetMaxAmmoInClip(cache.ped, currentWeapon.hash, true);

  const missingAmmo = clipSize - currentAmmo;
  const addAmmo = item.quantity > missingAmmo ? missingAmmo : item.quantity;
  const newAmmo = currentAmmo + addAmmo;

  if (currentAmmo === newAmmo) return;

  AddAmmoToPed(cache.ped, currentWeapon.hash, addAmmo);

  await sleep(100);

  if (cache.vehicle) {
    if ((cache.seat as number) > -1 || IsVehicleStopped(cache.vehicle)) TaskReloadWeapon(cache.ped, true);
    else
      waitFor(() => {
        RefillAmmoInstantly(cache.ped);

        const [_, ammo] = GetAmmoInClip(cache.ped, currentWeapon.hash);

        return ammo === newAmmo || undefined;
      });
  } else {
    MakePedReload(cache.ped);

    await waitFor(() => {
      DisableControlAction(0, 22, true);

      return IsPedReloading(cache.ped) || undefined;
    });
  }

  emitNet('ox_inventory:loadWeaponAmmo', addAmmo);
}

onNet('ox_inventory:updateCurrentWeapon', (item: Weapon) => {
  if (currentWeapon.uniqueId !== item.uniqueId) return;

  Object.assign(currentWeapon, item);
});
