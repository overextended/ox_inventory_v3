import Config from '@common/config';
import { BaseInventory } from '@common/inventory/class';
import fetch from 'sync-fetch';
import { isBrowser, resourceContext, resourceName } from '..';

export interface WeaponProperties extends BaseItem {
  category: 'weapon';
  ammoName: string;
  ammoCount: number;
  hash: number;
  tint?: number;
  components?: string[];
}

export interface WeaponAttachmentProperties extends BaseItem {
  category: 'weapon_attachment';
  components: string[];
}

export type ItemProperties = {
  name: string;
  quantity: number;
} & (Partial<BaseItem> | WeaponProperties | WeaponAttachmentProperties);

export type Item = ReturnType<typeof ItemFactory>;
export type InventoryItem = InstanceType<Item> | WeaponProperties;
export type Weapon = Item & WeaponProperties;

const Items: Record<string, Item> = {};
const InventoryItems: Record<string, InventoryItem> = {};

const excludeKeysForComparison: Record<string, true> = {
  uniqueId: true,
  quantity: true,
  anchorSlot: true,
  inventoryId: true,
  tempRotate: true,
};

export function GetItemData(name: string) {
  const item = Items[name.toLowerCase()];

  if (item && !item.properties.icon) {
    const iconPath = `${item.properties.category}/${item.name}.webp`;
    item.properties.icon = `${Config.Inventory_ImagePath}/${iconPath}`;

    // Use resource configured image path; fallback to ox cdn
    const iconUrl = item.properties.icon ?? `${Config.Inventory_ImagePath}/${iconPath}`;
    const iconType =
      resourceContext === 'web'
        ? (fetch(iconUrl)?.blob() as any)?.type
        : LoadResourceFile(resourceName, iconUrl) && 'image/webp';

    item.properties.icon = iconType === 'image/webp' ? iconUrl : `https://items.overextended.dev/${iconPath}`;
  }

  return item;
}

export function GetInventoryItem(uniqueId: number) {
  return InventoryItems[uniqueId];
}

function clamp(n = Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  return !n && n !== 0 ? max : Math.min(Math.max(n, 0), max);
}

const itemProxy: ProxyHandler<BaseItem> = {
  get: (target, prop: string) => {
    const value = target[prop];
    return value == null ? (target.constructor as Item).properties[prop] : value;
  },
};

export abstract class BaseItem {
  /** A unique name to identify the item type and inherit data. */
  readonly name: string;

  /** The number of items stored in the stack. */
  public quantity: number;

  /** The item's type, defaulting to miscellaneous. */
  public category: 'ammo' | 'weapon' | 'weapon_attachment' | 'throwable' | 'miscellaneous';

  /** A unique identifier used to reference the item and save it in the database. */
  public uniqueId?: number;

  /** The inventoryId of the inventory which holds this item. */
  public inventoryId?: string;

  /** The slotId for the top-left of the item. */
  public anchorSlot?: number;

  public icon?: string;
  public value?: number;
  public label?: string;
  public weight?: number;
  public rarity?: string;
  public decay?: boolean;
  public degrade?: number;
  public tradeable?: boolean;
  public itemLimit?: number;
  public stackSize?: number;
  public description?: string;
  public durability?: number;
  public rotate?: boolean;
  public ammoName?: string;
  public ammoCount?: number;
  public hash?: number;

  static [key: string]: unknown;
  [key: string]: unknown;

  static CreateUniqueId(item: BaseItem): number {
    // Temporary value used in the browser only.
    return (item.uniqueId = -Math.floor(Date.now() / 1000));
  }

  constructor() {
    // biome-ignore lint/correctness/noConstructorReturn: <explanation>
    return new Proxy(this, itemProxy);
  }

  get width(): number {
    const properties = (this.constructor as Item).properties;
    return (Config.Inventory_MultiSlotItems && (this.rotate ? properties.height : properties.width)) || 1;
  }

  get height(): number {
    const properties = (this.constructor as Item).properties;
    return (Config.Inventory_MultiSlotItems && (this.rotate ? properties.width : properties.height)) || 1;
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

    if (slots) {
      inventory.setSlotRefs(slots);
      delete this.anchorSlot;
      delete this.inventoryId;
    }

    return slots;
  }

  private swapItems(
    fromInventory: BaseInventory,
    toInventory: BaseInventory,
    toItem: InventoryItem,
    targetSlot: number,
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

  public toJSON() {
    const obj = {} as this;

    for (const key in this) {
      if (this[key] != null) obj[key] = this[key];
    }

    return obj;
  }

  public cache() {
    InventoryItems[this.uniqueId] = this;
  }

  public clone(): this {
    const clone = structuredClone(this);
    delete clone.uniqueId;
    // @ts-expect-error
    return new this.constructor(clone);
  }

  public delete() {
    this.quantity = 0;

    const inventory = this.inventoryId && BaseInventory.FromId(this.inventoryId);

    if (inventory) this.removeFromInventory(inventory);

    delete InventoryItems[this.uniqueId];
  }

  /**
   * Compares the properties of two items and returns `true` if they are similar enough to merge.
   *
   * If strictly matching, both item properties must match exactly; otherwise, missing properties are ignored.
   */
  public match(item: Partial<ItemProperties>, strict = true) {
    if (this.name !== item.name) return false;

    const keysA = Object.keys(this).filter((key) => this[key] !== undefined && !excludeKeysForComparison[key]);
    const keysB = Object.keys(item).filter((key) => item[key] !== undefined && !excludeKeysForComparison[key]);

    if (strict) if (keysA.length !== keysB.length) return false;

    for (const key of keysB) {
      if (this[key] !== item[key]) return false;
    }

    return true;
  }

  public move(inventory: BaseInventory, startSlot?: number): boolean {
    startSlot = startSlot ?? inventory.findAvailableSlot(this);
    const existingItem = inventory.getItemInSlot(startSlot);
    const currentInventory = this.inventoryId && BaseInventory.FromId(this.inventoryId);

    if (
      existingItem &&
      existingItem !== this &&
      this.width === existingItem.width &&
      this.height === existingItem.height &&
      existingItem.anchorSlot === startSlot
    ) {
      const canMerge = this.match(existingItem);

      if (canMerge) {
        existingItem.quantity += this.quantity;

        this.delete();
        existingItem.move(inventory, existingItem.anchorSlot);

        return true;
      }

      return this.swapItems(currentInventory, inventory, existingItem, startSlot);
    }

    const currentSlots = currentInventory && this.removeFromInventory(currentInventory);
    const quantity = existingItem === this ? this.quantity : this.quantity + (existingItem?.quantity ?? 0);

    [this.rotate, this.tempRotate] = [(this.tempRotate as boolean) ?? this.rotate, this.rotate];

    const slots = inventory.canHoldItem(this, startSlot, quantity);

    if (!slots) {
      this.tempRotate ? (this.rotate = true) : delete this.rotate;
      delete this.tempRotate;

      if (currentSlots) this.addToInventory(currentInventory, currentSlots);

      return false;
    }

    this.rotate ? (this.rotate = true) : delete this.rotate;
    delete this.tempRotate;

    return this.addToInventory(inventory, slots);
  }

  public split(inventory: BaseInventory, quantity: number, startSlot?: number): InventoryItem | null {
    const existingItem = inventory.getItemInSlot(startSlot);
    const currentInventory = BaseInventory.FromId(this.inventoryId);
    quantity = Math.max(1, Math.ceil(quantity));
    startSlot = startSlot ?? inventory.findAvailableSlot(this);

    if (existingItem?.anchorSlot === startSlot && currentInventory?.inventoryId === inventory.inventoryId) {
      this.tempRotate ? (this.rotate = true) : delete this.rotate;
      delete this.tempRotate;
      const canHoldItem = inventory.canHoldItem(this, startSlot, this.quantity + (existingItem?.quantity ?? 0));

      if (!canHoldItem) return null;

      existingItem.quantity += quantity;
      this.quantity -= quantity;

      return existingItem;
    }

    const clone = this.clone();
    clone.quantity = quantity;

    delete this.tempRotate;
    delete clone.tempRotate;

    if (!clone.rotate) delete clone.rotate;

    const slots = inventory.canHoldItem(clone, startSlot);

    if (!slots) return null;

    this.quantity -= clone.quantity;

    return clone.addToInventory(inventory, slots) && clone;
  }
}

export function ItemFactory(item: ItemProperties) {
  if (!item) return;

  item.category = item.category ?? 'miscellaneous';
  item.itemLimit = clamp(item.itemLimit);
  item.stackSize = clamp(item.category === 'weapon' ? 1 : item.stackSize);
  item.durability = (item.durability || item.decay || item.degrade) && 100;
  item.rarity = item.rarity ?? 'common';
  item.decay = item.decay ?? false;
  item.label = item.label ?? item.name;
  item.tradeable = item.tradeable ?? false;
  item.value = item.value ?? 0;

  if (item.category === 'weapon') {
    item.ammoName = item.ammoName || 'ammo_9';
  }

  const Item = class extends BaseItem {
    static properties = item;
    static descriptors = Object.getOwnPropertyDescriptors(this.prototype);

    readonly name = item.name;

    constructor(metadata?: Partial<ItemProperties>) {
      super();

      if (metadata) {
        Object.assign(this, metadata);
      }

      if (!this.uniqueId) Item.CreateUniqueId(this);
      if (this.uniqueId !== 0) this.cache();

      if (item.category === 'weapon') {
        this.durability = this.durability ?? Math.floor(Math.random() * 90) + 1;

        if (item.ammoName) this.ammoCount = this.ammoCount ?? 0;
      }
    }
  };

  Object.defineProperty(Item, 'name', { value: item.name });
  Items[item.name.toLowerCase()] = Item;

  return Item;
}
