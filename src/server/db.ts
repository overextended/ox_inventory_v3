import type { InventoryItem, ItemProperties } from '@common/item';
import { DatabaseSync } from 'node:sqlite';
import type { Inventory } from './inventory/class';
import { cache } from '@overextended/ox_lib';

const sqlite = new DatabaseSync(`${GetResourcePath(cache.resource)}/db.sqlite`);

if (!sqlite.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'items'`).get()) {
  const statement = LoadResourceFile(cache.resource, 'db.sql');

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

interface DbInventory {
  inventoryId: string;
  type: string;
  data: string;
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
  private _getInventory = sqlite.prepare(
    'SELECT inventoryId, type, json(data) as data FROM inventories WHERE inventoryId = ?',
  );
  private _insertInventory = sqlite.prepare(
    'INSERT INTO inventories (inventoryId, type, data) VALUES (?, ?, jsonb(?))',
  );
  private _getInventoryItems = sqlite.prepare(
    'SELECT uniqueId, inventoryId, json(data) as data FROM inventory_items WHERE inventoryId = ?',
  );
  private _deleteInventoryItem = sqlite.prepare('DELETE FROM inventory_items WHERE uniqueId = ?');
  private _updateInventoryItem = sqlite.prepare(
    'INSERT INTO inventory_items (uniqueId, inventoryId, data) VALUES (?, ?, jsonb(?)) ON CONFLICT(uniqueId) DO UPDATE SET inventoryId = excluded.inventoryId, data = excluded.data',
  );
  private _deleteInventory = sqlite.prepare('DELETE FROM inventories WHERE inventoryId = ?');
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

  getInventory(inventoryId: string): Partial<Inventory> {
    const result = this._getInventory.get(inventoryId) as DbInventory;

    if (result) return { inventoryId, type: result.type, ...JSON.parse(result.data) };
  }

  insertInventory(inventory: Partial<Inventory>) {
    const data = { ...inventory };
    delete data.inventoryId;
    delete data.type;

    return this._insertInventory.run(inventory.inventoryId, inventory.type, JSON.stringify(data)).changes === 1;
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

    const data = { ...item };
    delete data.uniqueId;
    delete data.inventoryId;

    const rowId = this._updateInventoryItem.run(
      item.uniqueId || null,
      item.inventoryId || null,
      JSON.stringify(data),
    )?.lastInsertRowid;

    if (!item.uniqueId) item.uniqueId = Number(rowId);

    return item.uniqueId;
  }

  deleteInventory(inventoryId: string, deleteItems = false) {
    const success = this._deleteInventory.run(inventoryId).changes;

    if (success && deleteItems) {
      this._deleteInventoryItems.run(inventoryId);
    }

    return success;
  }
})();

export default db;
