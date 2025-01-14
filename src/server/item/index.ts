import { GetRawItem, ItemFactory, ItemMetadata } from '@common/itemFactory';
import { oxmysql } from '@overextended/oxmysql';

export async function CreateItem(name: string, metadata?: ItemMetadata) {
  const Item =
    GetRawItem(name) ?? ItemFactory(name, await oxmysql.prepare(`SELECT * FROM ox_items WHERE name = ?`, [name]));

  return new Item(metadata);
}
