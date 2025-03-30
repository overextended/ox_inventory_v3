import { fetchNui } from '$lib/utils/fetchNui';
import { isEnvBrowser } from '$lib/utils/misc';
import { GetItemData, ItemFactory, type ItemProperties } from '~/src/common/item';

export async function CreateItem(data: Partial<ItemProperties>) {
  const name = data.name!;
  let Item = GetItemData(name);

  if (!Item) {
    const data = isEnvBrowser()
      ? name === 'heavypistol'
        ? {
            name,
            width: 1,
            height: 1,
            category: 'weapon',
          }
        : name === 'heavyrifle'
          ? {
              name,
              width: 1,
              height: 1,
              category: 'weapon',
            }
          : {
              name,
              width: 1,
              height: 1,
              category: 'ammo',
            }
      : await fetchNui('getStateKeyValue', ['global', `Item:${name.toLowerCase()}`]);

    ItemFactory(data);
    Item = GetItemData(name);

    if (!Item) throw new Error(`Attempted to create invalid item ${name}`);
  }

  return data ? new Item(data) : Item;
}
