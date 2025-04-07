import { DatabaseSync } from 'node:sqlite';
import type { InventoryItem, ItemProperties } from '@common/item';
import { cache } from '@overextended/ox_lib';
import { Inventory } from './inventory/class';

const sqlite = new DatabaseSync(`${GetResourcePath(cache.resource)}/db.sqlite`);

if (!sqlite.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'items'`).get()) {
  const statement = LoadResourceFile(cache.resource, 'sql/schema.sql');

  sqlite.exec(statement);
}

sqlite.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA journal_size_limit = 67108864;
  PRAGMA mmap_size = 134217728;
  PRAGMA cache_size = 2000;
`);

interface DbItem {
  name: string;
  data: string;
  category?: string;
}

interface DbInventoryItem {
  uniqueId: string;
  inventoryId: string | null;
  data: string;
}

const db = new (class Database {
  private _getItems = sqlite.prepare('SELECT name, category, JSON(data) as data FROM items');
  private _getItemByName = sqlite.prepare('SELECT name, category, json(data) as data FROM items WHERE name LIKE ?');
  private _getItemsByCategory = sqlite.prepare('SELECT name, json(data) as data FROM items WHERE category LIKE ?');
  private _getInventoryItems = sqlite.prepare(
    'SELECT uniqueId, inventoryId, json(data) as data FROM inventory_items WHERE inventoryId = ?',
  );
  private _deleteInventoryItem = sqlite.prepare('DELETE FROM inventory_items WHERE uniqueId = ?');
  private _updateInventoryItem = sqlite.prepare(
    'INSERT INTO inventory_items (uniqueId, inventoryId, data) VALUES (?, ?, jsonb(?)) ON CONFLICT(uniqueId) DO UPDATE SET inventoryId = excluded.inventoryId, data = excluded.data',
  );
  private _deleteInventoryItems = sqlite.prepare('DELETE FROM inventory_items WHERE inventoryId = ?');

  getItems(category?: string): ItemProperties[] {
    const results = (category ? this._getItemsByCategory.all(category) : this._getItems.all()) as DbItem[];

    return results.map((result) => {
      const obj = JSON.parse(result.data);
      obj.name = result.name;
      obj.category = category || result.category || 'miscellaneous';

      return obj;
    });
  }

  getItem(name: string): ItemProperties {
    const result = this._getItemByName.get(name) as DbItem;

    if (result) return { name: result.name, category: result.category, ...JSON.parse(result.data) };
  }

  getInventoryItems(inventoryId: string): ItemProperties[] {
    const results = this._getInventoryItems.all(inventoryId) as DbInventoryItem[];

    return results.map((result) => {
      const obj = JSON.parse(result.data);
      obj.uniqueId = result.uniqueId;
      obj.inventoryId = result.inventoryId;

      return obj;
    });
  }

  updateInventoryItem(item: Partial<InventoryItem>): number {
    if (item.quantity < 1) return this._deleteInventoryItem.run(item.uniqueId)?.changes ? 0 : item.uniqueId;

    const inventory = Inventory.FromId(item.inventoryId);

    if (!inventory) return;

    const data = { ...item };
    delete data.uniqueId;
    delete data.inventoryId;

    const rowId = this._updateInventoryItem.run(
      item.uniqueId || null,
      (!inventory.isTemporary && item.inventoryId) || null,
      JSON.stringify(data),
    )?.lastInsertRowid;

    if (!item.uniqueId) item.uniqueId = Number(rowId);

    return item.uniqueId;
  }

  deleteInventory(inventoryId: string) {
    return this._deleteInventoryItems.run(inventoryId).changes;
  }
})();

export default db;
