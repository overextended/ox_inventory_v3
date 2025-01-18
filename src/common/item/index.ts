import config from '@common/config';
import { ResourceName } from '@common/index';
import { randomUUID } from 'crypto';

export interface ItemMetadata {
  label?: string;
  weight?: number;
  icon?: string;
  value?: number;
  rarity?: string;
  degrade?: number;
  tradeable?: boolean;
}

export interface ItemProperties extends ItemMetadata {
  name: string;
  label: string;
  weight?: number;
  width?: number;
  height?: number;
  category?: string;
  decay?: boolean;
  itemLimit?: number;
  stackSize?: number;
  description?: string;
}

export interface Item extends ReturnType<typeof ItemFactory> {}
export interface InventoryItem extends InstanceType<Item> {}

const Items: Record<string, Item> = {};
const InventoryItems: Record<string, InventoryItem> = {};

export function GetRawItem(name: string) {
  return Items[name];
}

export function GetInventoryItem(uniqueId: string) {
  return InventoryItems[uniqueId];
}

function clamp(max: number = 4294967295, n: number = max) {
  return Math.min(Math.max(n, 0), max);
}

export function ItemFactory(name: string, item?: ItemProperties) {
  if (!item) throw new Error(`Attempted to create invalid item '${name}'`);

  item.itemLimit = clamp(4294967295, item.itemLimit);
  item.stackSize = clamp(65535, item.stackSize);

  const Item = class implements ItemProperties {
    /** A unique name to identify the item type and inherit data. */
    readonly name = item.name;

    /** A unique identifier used to reference the item and save it in the database. */
    readonly uniqueId: string;

    /** The number of items stored in the stack. */
    public quantity: number = 1;

    /** The inventoryId of the inventory which holds this item. */
    public inventoryId?: string;

    /** The slotId for the top-left of the item. */
    public anchorSlot?: number;

    [key: string]: unknown;

    constructor(metadata: ItemMetadata = {}) {
      Object.assign(this, metadata);
      this.uniqueId = randomUUID();
    }

    get itemLimit() {
      return item.itemLimit;
    }

    get stackSize() {
      return item.stackSize;
    }

    get category() {
      return item.category ?? 'miscellaneous';
    }

    get decay() {
      return item.decay ?? false;
    }

    get rarity() {
      return item.rarity ?? 'common';
    }

    get label() {
      return item.label;
    }

    get weight() {
      return item.weight;
    }

    get description() {
      return item.description;
    }

    get degrade() {
      return item.degrade;
    }

    get icon() {
      return item.icon ?? `${ResourceName}/${config.Inventory_ImagePath}/${item.name}.webp`;
    }

    get tradeable() {
      return item.tradeable ?? true;
    }

    get value() {
      return item.value ?? 0;
    }

    get width() {
      return item.width ?? 1;
    }

    get height() {
      return item.height ?? 1;
    }
  };

  Object.defineProperty(Item, 'name', { value: item.name });
  Items[item.name] = Item;

  return Item;
}
