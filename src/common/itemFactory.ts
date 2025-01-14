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

export function GetRawItem(name: string) {
  return Items[name];
}

export function ItemFactory(name: string, item?: ItemProperties) {
  if (!item) throw new Error(`Attempted to create invalid item '${name}'`);

  const Item = class implements ItemProperties {
    /** A unique name to identify the item type and inherit data. */
    readonly name = item.name;

    /** A unique identifier used to reference the item and save it in the database. */
    readonly uniqueId: string;

    /** The number of items stored in the stack. */
    public quantity: number = 1;

    /** The inventoryId of the inventory which holds this item. */
    public inventoryId?: string;

    [key: string]: unknown;

    constructor(metadata: ItemMetadata = {}) {
      Object.assign(this, metadata);
      this.uniqueId = randomUUID();
    }

    get itemLimit() {
      return item.itemLimit ?? 4294967295;
    }

    get stackSize() {
      return item.stackSize ?? 65535;
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
      return item.width ?? 3;
    }

    get height() {
      return item.height ?? 2;
    }
  };

  Object.defineProperty(Item, 'name', { value: item.name });
  Items[item.name] = Item;

  return Item;
}
