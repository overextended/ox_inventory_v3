import type { Clothing } from '@common/item/index';
import { cache, notify, requestModel, sleep } from '@overextended/ox_lib/client';

/**
 * Working out how to get clothing labels and wouldn't
 * have been possible without root-cause and the following resources:
 * - https://github.com/root-cause/v-labels
 * - https://github.com/root-cause/v-clothingnames
 * - https://github.com/root-cause/v-decompiled-scripts
 * - https://gist.github.com/root-cause/3b80234367b0c856d60bf5cb4b826f86
 */

function GetComponentHash(entity: number, componentId: number, drawableId: number, textureId: number, prop = false) {
  const native = prop ? GetHashNameForProp : GetHashNameForComponent;
  return native(entity, componentId, drawableId, textureId);
}

function GetPedComponentLabel(componentHash: number, isProp = false) {
  const buffer = new Uint8Array(120);
  const nativeHash = isProp ? '0x5D5CAFF661DDF6FC' : '0x74C0E2A57EC66760';

  Citizen.invokeNative(nativeHash, componentHash, buffer);

  let gxt = '';
  let i = 72;

  while (true) {
    const charCode = buffer[i];

    if (charCode === 0) return GetLabelText(gxt);

    gxt += String.fromCharCode(charCode);
    i++;
  }
}

const componentPrefix: Record<number, string> = {
  1: 'M', // MASK
  4: 'L', // LEGS
  6: 'F', // FEET
  7: 'T', // TEETH
  11: 'U', // UPPER
};

const propPrefix: Record<number, string> = {
  0: 'HT', // HAT
  1: 'G', // GLASSES
};

export async function GetClothingLabel(item: Clothing, model = 'mp_m_freemode_01', attempt = 1) {
  await sleep(0);

  if (attempt > 2) return '';

  await requestModel(model);
  const ped = CreatePed(0, model, 0, 0, 0, 0, false, false);

  SetModelAsNoLongerNeeded(model);

  if (!ped) return '';

  const isProp = item.name === 'ped_prop';
  const native = isProp ? GetPedPropGlobalIndexFromCollection : GetPedDrawableGlobalIndexFromCollection;
  const globalId = native(ped, item.componentId, item.collection, item.drawableId);
  const isMale = model === 'mp_m_freemode_01';

  if (globalId === -1) {
    DeleteEntity(ped);

    return GetClothingLabel(item, (model = isMale ? 'mp_f_freemode_01' : 'mp_m_freemode_01'), ++attempt);
  }

  const hash = GetComponentHash(ped, item.componentId, globalId, item.textureId, item.name === 'ped_prop');
  let label = hash ? GetPedComponentLabel(hash, item.name === 'ped_prop') : 'NULL';

  if (label === 'NULL') {
    const prefix = (isProp ? propPrefix : componentPrefix)[item.componentId];
    const gender = isMale ? 'FMM' : 'FMF';
    const name = `${prefix}_${gender}_${item.drawableId}_${item.textureId}`;
    label = GetLabelText(name);
    console.log(name, label, hash);
  }

  DeleteEntity(ped);

  return (label !== 'NULL' && label) || '';
}

export async function UseClothing(item: Clothing) {
  const playerModel = GetEntityArchetypeName(cache.ped);
  const collectionLower = item.collection.toLowerCase();
  const model =
    item.model || collectionLower.includes('_f_') || collectionLower.includes('female')
      ? 'mp_f_freemode_01'
      : 'mp_m_freemode_01';

  const isProp = item.name === 'ped_prop';
  const { componentId, collection, drawableId, textureId, palleteId } = item;
  const isClothingValid = isProp
    ? GetNumberOfPedCollectionPropDrawableVariations(cache.ped, componentId, collection) > 0
    : IsPedCollectionComponentVariationValid(cache.ped, componentId, collection, drawableId, textureId);

  if (model !== playerModel || !isClothingValid) {
    const notification = 'cannot_wear_clothing';

    notify({
      id: notification,
      description: notification,
      type: 'error',
    });
  } else if (isProp) SetPedCollectionPropIndex(cache.ped, componentId, collection, drawableId, textureId, true);
  else SetPedCollectionComponentVariation(cache.ped, componentId, collection, drawableId, textureId, palleteId);

  const label = await GetClothingLabel(item, model);

  notify({
    description: `Put on ${label || item.name}.`,
  });

  return isClothingValid;
}
