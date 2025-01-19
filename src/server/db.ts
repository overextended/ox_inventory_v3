import { ItemProperties } from '@common/item';
import { oxmysql } from '@overextended/oxmysql';

export function GetDbItemData(name: string): Promise<ItemProperties> {
  return oxmysql.prepare(`SELECT * FROM ox_items WHERE name = ?`, [name]);
}
