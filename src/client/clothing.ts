import type { Clothing } from '@common/item/index';
import { cache, notify, requestModel, sleep } from '@overextended/ox_lib/client';

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

export async function GetClothingLabel(item: Clothing, model = 'mp_m_freemode_01', attempt = 1) {
  await sleep(0);

  if (attempt > 2) return '';

  await requestModel(model);
  const ped = CreatePed(0, model, 0, 0, 0, 0, false, false);

  SetModelAsNoLongerNeeded(model);

  if (!ped) return '';

  const native =
    item.name === 'accessory' ? GetPedPropGlobalIndexFromCollection : GetPedDrawableGlobalIndexFromCollection;

  const globalId = native(ped, item.componentId, item.collection, item.drawableId);

  if (globalId === -1) {
    DeleteEntity(ped);

    return GetClothingLabel(
      item,
      (model = model === 'mp_m_freemode_01' ? 'mp_f_freemode_01' : 'mp_m_freemode_01'),
      ++attempt,
    );
  }

  const hash = GetComponentHash(ped, item.componentId, globalId, item.textureId, item.name === 'accessory');
  const label = GetPedComponentLabel(hash, item.name === 'accessory');

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

  const isProp = item.name === 'accessory';
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
