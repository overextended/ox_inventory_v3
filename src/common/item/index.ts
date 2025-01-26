import config from '@common/config';
import { ResourceName } from '@common/index';
import { BaseInventory } from '@common/inventory/class';

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
  inventoryId?: string;
}

export interface Item extends ReturnType<typeof ItemFactory> {}
export interface InventoryItem extends InstanceType<Item> {}

const Items: Record<string, Item> = {};
const InventoryItems: Record<string, InventoryItem> = {};

export function GetItemData(name: string) {
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
    readonly name = name;

    // TODO: ONLY CHANGED TO PUBLIC FOR TESTING WEB (need a way to assign it maybe?)
    /** A unique identifier used to reference the item and save it in the database. */
    public uniqueId: string;

    /** The number of items stored in the stack. */
    public quantity: number = 1;

    /** The inventoryId of the inventory which holds this item. */
    public inventoryId?: string;

    /** The slotId for the top-left of the item. */
    public anchorSlot?: number;

    [key: string]: unknown;

    constructor(metadata?: ItemMetadata) {
      if (metadata) {
        if ('name' in metadata) delete metadata.name;
        if ('metadata' in metadata) delete metadata.metadata;

        Object.assign(this, metadata, 'metadata' in metadata ? metadata.metadata : null);
        InventoryItems[this.uniqueId] = this;
      }
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

    /**
     * Determines the slotIds that will be occupied by an item, starting from startSlot.
     * @returns An array containing the slotIds that hold the item.
     */
    private getSlots(inventory: BaseInventory, startSlot: number) {
      const slots: number[] = [];

      for (let y = 0; y < this.height; y++) {
        const offset = startSlot + y * inventory.width;

        for (let x = 0; x < this.width; x++) {
          const slotId = offset + x;
          const doesItemOverlap = inventory.items[slotId] && inventory.items[slotId] !== this.uniqueId;
          const doesItemOverflow = Math.floor(slotId / inventory.width) !== Math.floor(offset / inventory.width);

          if (doesItemOverlap || doesItemOverflow) return false;

          slots.push(slotId);
        }
      }

      return slots;
    }

    /**
     * Determines if item placement is valid based on size, inventory dimensions, weight, etc.
     * @todo: weight checks and other validation methods
     */
    public canMove(inventory: BaseInventory, startSlot: number) {
      const doesItemFit =
        (startSlot % inventory.width) + this.width <= inventory.width &&
        Math.floor(startSlot / inventory.width) + this.height <= inventory.height;

      if (!doesItemFit) return false;

      return this.getSlots(inventory, startSlot);
    }

    public move(inventory: BaseInventory, startSlot: number) {
      const slots = this.canMove(inventory, startSlot);

      if (!slots) return false;

      if (this.anchorSlot) {
        const fromInventory = BaseInventory.fromId(this.inventoryId);
        const oldSlots = this.getSlots(fromInventory, this.anchorSlot);

        if (oldSlots) inventory.setSlotRefs(oldSlots);
      }

      inventory.setSlotRefs(slots, this.uniqueId);

      this.anchorSlot = startSlot;
      this.inventoryId = inventory.inventoryId;

      return true;
    }
  };

  Object.defineProperty(Item, 'name', { value: item.name });
  Items[item.name] = Item;

  return Item;
}
