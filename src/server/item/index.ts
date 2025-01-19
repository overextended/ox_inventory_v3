import { GetItemData, ItemFactory, ItemMetadata, ItemProperties } from '@common/item';
import { oxmysql } from '@overextended/oxmysql';

function GetItemFromDb(name: string): Promise<ItemProperties> {
  return oxmysql.prepare(`SELECT * FROM ox_items WHERE name = ?`, [name]);
}

export async function CreateItem(name: string, metadata?: ItemMetadata) {
  const Item = GetItemData(name) ?? ItemFactory(name, await GetItemFromDb(name));

  return new Item(metadata);
}
