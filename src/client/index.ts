import './keybinds';
import './item';
import './weapon';
import Config from '@common/config';
import { GROUP_FIREEXTINGUISHER, GROUP_PETROLCAN } from '@common/hash';
import { cache, onServerCallback } from '@overextended/ox_lib/client';
import { InventoryState, inventoryState } from './inventory';
import { isUsingItem } from './item';
import { currentWeapon, weaponWheelEnabled } from './weapon';
import './clothing';
import { Vector3 } from '@nativewrappers/fivem';

onServerCallback('ox_inventory:getVehicleClass', (netId) => GetVehicleClass(NetworkGetEntityFromNetworkId(netId)));

setInterval(() => {
  cache.coords = Vector3.fromArray(GetEntityCoords(cache.ped, true));
}, 500);

setTick(() => {
  DisablePlayerVehicleRewards(cache.playerId);

  if (inventoryState === InventoryState.Open) {
    DisableAllControlActions(0);
    HideHudAndRadarThisFrame();

    for (let index = 0; index < Config.Inventory_EnableKeys.length; index++) {
      EnableControlAction(0, Config.Inventory_EnableKeys[index], true);
    }

    return;
  }

  if (inventoryState === InventoryState.Busy) {
    DisableControlAction(0, 23, true);
    DisableControlAction(0, 36, true);
  }

  if (isUsingItem || IsPedCuffed(cache.ped)) {
    DisablePlayerFiring(cache.playerId, true);
  }

  if (!weaponWheelEnabled) {
    HudWeaponWheelIgnoreSelection();
    DisableControlAction(0, 37, true);
  }

  if (currentWeapon.timer === undefined) return;

  DisableControlAction(0, 80, true);
  DisableControlAction(0, 140, true);

  if (
    currentWeapon.durability <= 0 ||
    (Config.Weapon_AimedFiring &&
      !currentWeapon.isMelee &&
      currentWeapon.group !== GROUP_PETROLCAN &&
      !IsPlayerFreeAiming(cache.playerId))
  ) {
    DisablePlayerFiring(cache.playerId, true);
  }

  if (inventoryState !== InventoryState.Busy && currentWeapon.timer > 0 && currentWeapon.timer < GetGameTimer()) {
    currentWeapon.timer = 0;

    emitNet('ox_inventory:updateWeapon', currentWeapon.ammoCount, currentWeapon.durability);
    return;
  }

  if (currentWeapon.isMelee && IsPedPerformingMeleeAction(cache.ped)) {
    currentWeapon.timer = GetGameTimer() + 200;
    return;
  }

  if (currentWeapon.ammoName && IsPedShooting(cache.ped)) {
    let currentAmmo = GetAmmoInPedWeapon(cache.ped, currentWeapon.hash);

    if (currentAmmo < currentWeapon.ammoCount) {
      currentWeapon.ammoCount = currentAmmo;
      // todo: calculate durability loss
    }

    if (currentAmmo <= 0 && cache.vehicle) TaskSwapWeapon(cache.ped, true);

    currentWeapon.timer = GetGameTimer() + currentWeapon.shotDelay * 1000 + 100;

    return;
  }

  if (currentWeapon.group === GROUP_PETROLCAN || currentWeapon.group === GROUP_FIREEXTINGUISHER) {
    // todo
  }
});
