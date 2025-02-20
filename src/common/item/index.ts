import Config from '@common/config';
import { BaseInventory } from '@common/inventory/class';
import fetch from 'sync-fetch';
import { ResourceContext, ResourceName } from '..';

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
const excludeKeysForComparison: Record<string, true> = {
  uniqueId: true,
  quantity: true,
  anchorSlot: true,
  inventoryId: true,
};

export function GetItemData(name: string) {
  return Items[name];
}

export function GetInventoryItem(uniqueId: number) {
  return InventoryItems[uniqueId];
}

function clamp(n = Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  return !n && n !== 0 ? max : Math.min(Math.max(n, 0), max);
}

export function ItemFactory(name: string, item: ItemProperties) {
  if (!item) throw new Error(`Attempted to create invalid item '${name}'`);

  item.name = name;
  item.category = item.category ?? 'miscellaneous';
  item.itemLimit = clamp(item.itemLimit);
  item.stackSize = clamp(item.category === 'weapon' ? 1 : item.stackSize);

  const iconPath = `${item.category}/${item.name}.webp`;
  let hasIcon = false;

  item.icon = item.icon ?? `${Config.Inventory_ImagePath}/${iconPath}`;

  const Item = class implements ItemProperties {
    static properties = item;

    static CreateUniqueId(item: InventoryItem): number {
      // Temporary value used in the browser only.
      return (item.uniqueId = -Math.floor(Date.now() / 1000));
    }

    /** A unique name to identify the item type and inherit data. */
    readonly name = name;

    /** A unique identifier used to reference the item and save it in the database. */
    public uniqueId: number;

    /** The number of items stored in the stack. */
    public quantity: number = 1;

    /** The inventoryId of the inventory which holds this item. */
    public inventoryId?: string;

    /** The slotId for the top-left of the item. */
    public anchorSlot?: number;

    public durability?: number;
    public rotate?: boolean;

    [key: string]: unknown;

    constructor(metadata?: ItemMetadata) {
      if (metadata) {
        if ('name' in metadata) delete metadata.name;
        if ('metadata' in metadata) delete metadata.metadata;

        Object.assign(this, metadata, 'metadata' in metadata ? metadata.metadata : null);
      }

      if (!this.uniqueId) Item.CreateUniqueId(this);

      // testing only
      if (item.category === 'weapon' && !this.durability) {
        this.durability = Math.floor(Math.random() * 90) + 1;
      }

      InventoryItems[this.uniqueId] = this;
    }

    get itemLimit() {
      return item.itemLimit;
    }

    get stackSize() {
      return item.stackSize;
    }

    get category() {
      return item.category;
    }

    get decay() {
      return item.decay ?? false;
    }

    get rarity() {
      return item.rarity ?? 'common';
    }

    get label() {
      return item.label ?? item.name;
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
      if (!hasIcon) {
        // Use resource configured image path; fallback to ox cdn
        const iconUrl = item.icon ?? `${Config.Inventory_ImagePath}/${iconPath}`;
        const iconType =
          ResourceContext === 'web'
            ? (fetch(iconUrl)?.blob() as any)?.type
            : LoadResourceFile(ResourceName, iconUrl) && 'image/webp';

        item.icon = iconType === 'image/webp' ? iconUrl : `https://items.overextended.dev/${iconPath}`;
        hasIcon = true;
      }

      return item.icon;
    }

    get tradeable() {
      return item.tradeable ?? true;
    }

    get value() {
      return item.value ?? 0;
    }

    get width() {
      return (Config.Inventory_MultiSlotItems && this.rotate ? item.height : item.width) || 1;
    }

    get height() {
      return (Config.Inventory_MultiSlotItems && this.rotate ? item.width : item.height) || 1;
    }

    private addToInventory(inventory: BaseInventory, slots: number[]) {
      inventory.setSlotRefs(slots, this.uniqueId);

      this.anchorSlot = slots[0];
      this.inventoryId = inventory.inventoryId;

      return true;
    }

    private removeFromInventory(inventory: BaseInventory) {
      if (!inventory || this.inventoryId !== inventory.inventoryId) return false;

      const slots = inventory.getSlotsForItem(this, this.anchorSlot);
      delete this.anchorSlot;
      delete this.inventoryId;

      return slots ? inventory.setSlotRefs(slots) : false;
    }

    private swapItems(
      fromInventory: BaseInventory,
      toInventory: BaseInventory,
      toItem: InventoryItem,
      targetSlot: number
    ) {
      const originalSlot = this.anchorSlot;
      const currentSlots = fromInventory.getItemSlots(this);
      const targetItemSlots = toInventory.getItemSlots(toItem);

      this.removeFromInventory(fromInventory);
      toItem.removeFromInventory(toInventory);

      const newItemSlots = fromInventory.canHoldItem(this, originalSlot);
      const newTargetSlots = toInventory.canHoldItem(toItem, targetSlot);

      if (!newItemSlots || !newTargetSlots) {
        this.addToInventory(fromInventory, currentSlots);
        toItem.addToInventory(toInventory, targetItemSlots);
        return false;
      }

      this.addToInventory(toInventory, newTargetSlots);
      toItem.addToInventory(fromInventory, newItemSlots);

      return true;
    }

    /**
     * Temporary workaround for a weird rendering issue.
     */
    public delete() {
      const inventory = this.inventoryId && BaseInventory.fromId(this.inventoryId);

      if (inventory) this.removeFromInventory(inventory);

      delete InventoryItems[this.uniqueId];
    }

    /**
     * Compares the properties of two items and returns `true` if they are similar enough to merge the stacks.
     */
    public canMerge(item: InventoryItem) {
      const keysA = Object.keys(this).filter((key) => !excludeKeysForComparison[key]);
      const keysB = Object.keys(item).filter((key) => !excludeKeysForComparison[key]);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (this[key] !== item[key]) return false;
      }

      return true;
    }

    public move(inventory: BaseInventory, startSlot?: number) {
      startSlot = startSlot ?? inventory.findAvailableSlot(this);
      const existingItem = inventory.getItemInSlot(startSlot);

      if (
        existingItem &&
        existingItem !== this &&
        this.width === existingItem.width &&
        this.height === existingItem.height &&
        !this.canMerge(existingItem)
      ) {
        return this.swapItems(BaseInventory.fromId(this.inventoryId), inventory, existingItem, startSlot);
      }

      const quantity = existingItem === this ? this.quantity : this.quantity + (existingItem?.quantity ?? 0);
      const slots = inventory.canHoldItem(this, startSlot, quantity);

      if (!slots) return false;

      this.removeFromInventory(BaseInventory.fromId(this.inventoryId));

      if (existingItem?.anchorSlot === startSlot) {
        existingItem.quantity += this.quantity;
        this.quantity = 0;

        // todo: maybe improve this hacky method of forcing kvp sync
        existingItem.move(inventory, existingItem.anchorSlot);

        return true;
      }

      return this.addToInventory(inventory, slots);
    }

    public split(inventory: BaseInventory, quantity: number, startSlot?: number) {
      const existingItem = inventory.getItemInSlot(startSlot);
      quantity = Math.max(1, Math.ceil(quantity));
      startSlot = startSlot ?? inventory.findAvailableSlot(this);

      if (existingItem?.anchorSlot === startSlot) {
        const canHoldItem = inventory.canHoldItem(this, startSlot, this.quantity + (existingItem?.quantity ?? 0));

        if (!canHoldItem) return false;

        existingItem.quantity += quantity;
        this.quantity -= quantity;

        return existingItem;
      }

      const clone = structuredClone(this);
      delete clone.uniqueId;
      clone.quantity = quantity;

      const newItem = new Item(clone);

      const slots = inventory.canHoldItem(newItem, startSlot);

      if (!slots) return false;

      this.quantity -= newItem.quantity;

      return newItem.addToInventory(inventory, slots) && newItem;
    }
  };

  Object.defineProperty(Item, 'name', { value: item.name });
  Items[item.name] = Item;

  return Item;
}
