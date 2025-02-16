import { GetItemData, ItemFactory, type ItemProperties } from '~/src/common/item';
import { isEnvBrowser } from '$lib/utils/misc';
import { fetchNui } from '$lib/utils/fetchNui';

export async function CreateItem(name: string, metadata: Partial<ItemProperties> = {}) {
  let Item = GetItemData(name);

  if (!Item) {
    const data = isEnvBrowser()
      ? {
          name,
          quantity: 1,
          inventoryId: 'player',
          width: 2,
          height: 2,
          category: name.includes('ammo_') ? 'ammo' : 'weapon',
        }
      : await fetchNui(`getStateKeyValue`, [`global`, `Item:${name}`]);
    Item = ItemFactory(name, data);
  }

  return new Item(metadata);
}
