import { GetItemData, ItemFactory, type ItemProperties } from '~/src/common/item';
import { isEnvBrowser } from '$lib/utils/misc';
import { fetchNui } from '$lib/utils/fetchNui';

export async function CreateItem(metadata: Partial<ItemProperties>) {
  const name = metadata.name!;
  let Item = GetItemData(name);

  if (!Item) {
    const data = isEnvBrowser()
      ? name === 'HeavyPistol'
        ? {
            name,
            width: 2,
            height: 2,
            category: 'weapon',
          }
        : name === 'HeavyRifle'
          ? {
              name,
              width: 7,
              height: 3,
              category: 'weapon',
            }
          : {
              name,
              width: 1,
              height: 1,
              category: 'ammo',
            }
      : await fetchNui('getStateKeyValue', ['global', `Item:${name}`]);

    ItemFactory(data);
    Item = GetItemData(name);

    if (!Item) throw new Error(`Attempted to create invalid item ${name}`);
  }

  return metadata ? new Item(metadata) : Item;
}
