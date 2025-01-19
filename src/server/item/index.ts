import { GetItemData, ItemFactory, ItemMetadata, } from '@common/item';
import { GetDbItemData } from '../db';

export async function CreateItem(name: string, metadata?: ItemMetadata) {
  const Item = GetItemData(name) ?? ItemFactory(name, await GetDbItemData(name));

  return new Item(metadata);
}
