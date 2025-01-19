import { BaseInventory } from '@common/inventory/class';
import { ItemMetadata, ItemProperties } from '@common/item';
import { oxmysql } from '@overextended/oxmysql';

export function GetDbItemData(name: string): Promise<ItemProperties> {
  return oxmysql.query(`SELECT * FROM ox_items WHERE name = ?`, [name]);
}

export function GetDbInventoryData(inventoryId: string): Promise<BaseInventory> {
  return oxmysql.prepare(`SELECT * FROM ox_inventories WHERE inventoryId = ?`, [inventoryId]);
}

export function GetDbInventoryItems(inventoryId: string): Promise<{inventoryId: string, uniqueId: number, name: string, metadata: string | ItemMetadata}[]> {
  return oxmysql.rawExecute(`SELECT * FROM ox_inventory_items WHERE inventoryId = ?`, [inventoryId]);
}

export function AddDbInventoryItem(name: string, data: ItemMetadata & { inventoryId?: string }) {
  const metadata = { ...data };
  delete metadata.inventoryId;

  return oxmysql.prepare(`INSERT INTO ox_inventory_items (inventoryId, name, metadata) VALUES (?, ?, ?)`, [
    data.inventoryId,
    name,
    JSON.stringify(metadata),
  ]);
}
