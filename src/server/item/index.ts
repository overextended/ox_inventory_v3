import { GetItemData, ItemFactory, ItemProperties } from '@common/item';
import { AddDbInventoryItem, GetDbItemData } from '../db';

// todo: fix this annoying typing
export async function CreateItem(name: string, metadata: Partial<ItemProperties> = {}) {
  const Item = GetItemData(name) ?? ItemFactory(name, await GetDbItemData(name));

  if (!(metadata as any).uniqueId) (metadata as any).uniqueId = await AddDbInventoryItem(name, metadata);

  return new Item(metadata);
}
