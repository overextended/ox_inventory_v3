import { GetItemData, ItemFactory, type ItemProperties } from '~/src/common/item';
import { isEnvBrowser } from '$lib/utils/misc';
import { fetchNui } from '$lib/utils/fetchNui';

export async function CreateItem(name: string, metadata: Partial<ItemProperties> = {}) {
  let Item = GetItemData(name);

  console.log('createitem', name)

  if (!Item) {
    const data = isEnvBrowser()
      ? name === 'HeavyPistol' ? {
          name,
          width: 2,
          height: 2,
          category: 'weapon',
        } : name === 'HeavyRifle' ? {
          name,
          width: 7,
          height: 3,
          category: 'weapon',
        } : {
          name,
          width: 1,
          height: 1,
          category: 'ammo',
        }
      : await fetchNui(`getStateKeyValue`, [`global`, `Item:${name}`]);
    Item = ItemFactory(name, data);
  }

  return new Item(metadata);
}
