import type { InventoryItem } from '@common/item';
import type { Inventory } from './inventory/class';

// todo: utilise kvp class from nativewrappers, once the kinks are worked out

type KvpSchema = Record<string, string | number | object>;

type KvpObject<T> = T extends `${infer Prefix}.${infer Rest}`
  ? Rest extends `${string}.${string}`
    ? never
    : Prefix
  : never;

type ValidJsonKey<Schema> = {
  [K in keyof Schema]: K extends string ? `${K}.${string}` : never;
}[keyof Schema];

export class Kvp<Schema extends KvpSchema> {
  /**
   * Returns the value associated with a key as a number.
   */
  public getNumber<K extends string & keyof Schema>(key: K): number {
    return GetResourceKvpInt(key);
  }

  /**
   * Returns the value associated with a key as a float.
   */
  public getFloat<K extends string & keyof Schema>(key: K): number {
    return GetResourceKvpFloat(key);
  }

  /**
   * Returns the value associated with a key as a string.
   */
  public getString<K extends string & keyof Schema>(key: K): string | null {
    return GetResourceKvpString(key);
  }

  /**
   * Returns the value associated with a key as a parsed JSON string.
   */
  public getJson<K extends string, O = KvpObject<K>>(
    key: K extends ValidJsonKey<O> ? K : never,
  ): O extends string ? Schema[O] : null {
    const str = GetResourceKvpString(key);
    return str ? JSON.parse(str) : null;
  }

  /**
   * Sets the value associated with a key as a number.
   * @param async set the value using an async operation.
   */
  public setNumber<K extends string & keyof Schema>(key: K, value: number, async = false): void {
    return async ? SetResourceKvpIntNoSync(key, value as number) : SetResourceKvpInt(key, value as number);
  }

  /**
   * Sets the value associated with a key as a float.
   * @param async set the value using an async operation.
   */
  public setFloat<K extends string & keyof Schema>(key: K, value: number, async = false): void {
    return async ? SetResourceKvpFloatNoSync(key, value) : SetResourceKvpFloat(key, value);
  }

  /**
   * Sets the value associated with a key as a string.
   * @param async set the value using an async operation.
   */
  public setString<K extends string & keyof Schema>(key: K, value: string, async = false): void {
    return async ? SetResourceKvpNoSync(key, value) : SetResourceKvp(key, value);
  }

  /**
   * Sets the value associated with a key as a JSON string.
   * @param async set the value using an async operation.
   */
  public setJson<K extends string, O = KvpObject<K>>(
    key: K extends ValidJsonKey<O> ? K : never,
    value: O extends string ? Schema[O] : never,
    async = false,
  ): void {
    const str = JSON.stringify(value);
    return async ? SetResourceKvpNoSync(key, str) : SetResourceKvp(key, str);
  }

  /**
   * Sets the value associated with a key as a JSON string.
   * @param async set the value using an async operation.
   */
  public set<K extends string, O = KvpObject<K>>(
    key: K extends keyof Schema ? K : O extends string ? K : never,
    value: K extends keyof Schema ? Schema[K] : O extends string ? Schema[O] : never,
    async = false,
  ): void {
    switch (typeof value) {
      case 'function':
      case 'symbol':
        throw new Error(`Failed to set Kvp for invalid type '${typeof value}'`);
      case 'undefined':
        return this.delete(key, async);
      case 'object':
        return this.setJson(key as any, value, async);
      case 'boolean':
        (value as any) = value ? 1 : 0;
      case 'number':
        return Number.isInteger(value) ? this.setNumber(key, value, async) : this.setFloat(key, value, async);
      default:
        (value as any) = String(value);
        return this.setString(key, value as string, async);
    }
  }

  /**
   * Deletes the specified value for key.
   * @param async remove the value using an async operation
   */
  public delete(key: string, async = false): void {
    return async ? DeleteResourceKvpNoSync(key) : DeleteResourceKvp(key);
  }

  /**
   * Commits pending asynchronous operations to disk, ensuring data consistency.
   *
   * Should be called after calling set methods using the async flag.
   */
  public flush(): void {
    FlushResourceKvp();
  }

  public getAllKeys(prefix: string) {
    const keys: (keyof Schema)[] = [];
    const handle = StartFindKvp(prefix);

    if (handle === -1) return keys;

    let key: string;

    do {
      key = FindKvp(handle);
      if (key) keys.push(key);
    } while (key);

    EndFindKvp(handle);

    return keys;
  }

  /**
   * Returns an array of keys which match or contain the given keys.
   */
  public getKeys<K extends (string & keyof Schema) | string[]>(prefix: K) {
    return typeof prefix === 'string' ? this.getAllKeys(prefix) : prefix.flatMap((key) => this.getAllKeys(key));
  }

  /**
   * Get all values from keys in an array as the specified type.
   */
  public getValuesAsType<K extends (string & keyof Schema) | (string & keyof Schema)[]>(prefix: K, type: any) {
    const values = this.getKeys(prefix);

    return values.map((key) => {
      switch (type) {
        case 'number':
          return this.getNumber(key as any);
        case 'float':
          return this.getFloat(key as any);
        case 'string':
          return this.getString(key as any);
        default:
          return this.getJson(key as any);
      }
    });
  }
}

const kvp = new Kvp<{
  last_item_id: number;
  inventory_item: InventoryItem;
  inventory_items: number[];
  last_cleared: string;
}>();

export default kvp;

export function GetInventoryItems(inventoryId: string) {
  const itemIds = kvp.getJson(`inventory_items.${inventoryId}`) ?? [];
  return Array.from(itemIds, (itemId) => kvp.getJson(`inventory_item.${itemId}`));
}

export function UpdateInventoryItem(uniqueId: number, item?: InventoryItem) {
  if (!item || item.quantity < 1) return kvp.delete(`inventory_item.${uniqueId}`, true);

  kvp.setJson(`inventory_item.${uniqueId}`, item, true);
}

export function UpdateInventoryItems(inventory: Inventory) {
  kvp.setJson(`inventory_items.${inventory.inventoryId}`, inventory.itemIds(), true);
}

let lastItemId = kvp.getNumber('last_item_id');

export function AddInventoryItem(name: string, data: InventoryItem) {
  data.uniqueId = ++lastItemId;

  kvp.setNumber('last_item_id', lastItemId, true);
  kvp.setJson(`inventory_item.${data.uniqueId}`, { name, ...data } as InventoryItem, true);
  kvp.flush();

  return data as InventoryItem;
}

// debugging
console.log(kvp.getAllKeys(''));

RegisterCommand(
  'clearInventoryKvp',
  (playerId: number) => {
    if (playerId > 0) return;

    const keys = kvp.getAllKeys('');
    keys.forEach((key) => kvp.delete(key));
  },
  true,
);

setImmediate(() => {
  const lastCleared = Number(kvp.getString('last_cleared')) || 0;
  const timestamp = Date.now();
  const elapsed = timestamp - lastCleared;
  let clearedKeys = 0;

  // temp value - probably run daily?
  if (!lastCleared || elapsed > 600) {
    console.log(`^3Starting kvp validation${lastCleared ? ` - validation last ran ${elapsed}ms ago!` : ''}^0`);

    const inventory_item = kvp.getAllKeys('inventory_item.');
    const inventoryItems: Record<string, number[]> = {};

    inventory_item.forEach((key) => {
      const data = kvp.getJson(key as any) as Partial<InventoryItem>;
      let isValid = true;

      console.log(`^3Checking data for '${key}'.^0`);

      if (data.inventoryId) {
        let items = inventoryItems[data.inventoryId];

        if (!items) {
          items = kvp.getJson(`inventory_items.${data.inventoryId}`);
          inventoryItems[data.inventoryId] = items;
        }

        if (!items) {
          console.log(`^3 No inventory exists with id ${data.inventoryId}!^0`);
          isValid = false;
        } else if (items.indexOf(data.uniqueId) < 0) {
          console.log(`^3 ${key} is not part of inventory ${data.inventoryId}!^0`);
          isValid = false;
        }
      } else {
        console.log(`^3 ${key} has no inventory!^0`);
        isValid = false;
      }

      if (!isValid) {
        console.log(`^1 ${key} is invalid! Clearing data from kvp.`);
        kvp.delete(key);
        clearedKeys++;
      }
    });

    kvp.setString('last_cleared', timestamp.toString());
    console.log(`^2Kvp validation completed. ${clearedKeys} keys have been removed.^0`);
  }
});
