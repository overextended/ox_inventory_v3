import { BaseInventory } from '@common/inventory/class';
import { ItemMetadata, ItemProperties } from '@common/item';
import { oxmysql } from '@overextended/oxmysql';

export function GetDbItemData(name: string): Promise<ItemProperties> {
  return oxmysql.single(`SELECT * FROM ox_items WHERE name = ?`, [name]);
}

export function GetDbInventoryData(inventoryId: string): Promise<BaseInventory> {
  return oxmysql.prepare(`SELECT * FROM ox_inventories WHERE inventoryId = ?`, [inventoryId]);
}

export function InsertDbInventoryData(inventory: Partial<BaseInventory>) {
  return oxmysql.prepare(
    `INSERT INTO ox_inventories (inventoryId, ownerId, type, label, width, height, maxWeight) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      inventory.inventoryId,
      inventory.ownerId,
      inventory.type,
      inventory.label,
      inventory.width,
      inventory.height,
      inventory.maxWeight,
    ]
  );
}

export function GetDbInventoryItems(
  inventoryId: string
): Promise<{ inventoryId: string; uniqueId: number; name: string; metadata: string | ItemMetadata }[]> {
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

export function UpdateDbInventoryItem(uniqueId: number, data: ItemMetadata) {
  return oxmysql.prepare(`UPDATE ox_inventory_items SET metadata = ? WHERE uniqueId = ?`, [
    JSON.stringify(data),
    uniqueId,
  ]);
}
