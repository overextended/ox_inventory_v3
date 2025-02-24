import { BaseInventory } from '@common/inventory/class';
import { ItemProperties } from '@common/item';
import { oxmysql } from '@overextended/oxmysql';

export function GetDbItemData(): Promise<ItemProperties[]> {
  return oxmysql.query(`SELECT * FROM ox_items`);
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
): Promise<{ inventoryId: string; uniqueId: number; name: string; metadata: string | Partial<ItemProperties> }[]> {
  return oxmysql.rawExecute(`SELECT * FROM ox_inventory_items WHERE inventoryId = ?`, [inventoryId]);
}

export function AddDbInventoryItem(name: string, data: Partial<ItemProperties>) {
  const metadata = { ...data };
  delete metadata.inventoryId;

  return oxmysql.prepare(`INSERT INTO ox_inventory_items (inventoryId, name, metadata) VALUES (?, ?, ?)`, [
    data.inventoryId,
    name,
    JSON.stringify(metadata),
  ]);
}

export function UpdateDbInventoryItem(uniqueId: number, data: Partial<ItemProperties>) {
  return oxmysql.prepare(`UPDATE ox_inventory_items SET metadata = ? WHERE uniqueId = ?`, [
    JSON.stringify(data),
    uniqueId,
  ]);
}
