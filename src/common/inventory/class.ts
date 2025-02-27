import Config from '@common/config';
import { GetInventoryItem, InventoryItem } from '@common/item';

export class BaseInventory {
  static instances: Record<string, BaseInventory> = {};
  /** A unique identifier used to reference the inventory and save it in the database. */
  public inventoryId: string;

  /** The inventory type, such as player, glovebox, trunk, etc. */
  public type: string;

  /** An object where each key-value refers to the grid position and an item's uniqueid in that slot. */
  public items: Record<number, number> = {};

  public label: string;
  public width: number;
  public height: number;
  public weight: number;
  public maxWeight: number;
  public playerId: number;
  public netId?: number;
  public ownerId?: string;
  public coords?: [number, number, number];

  constructor(data: Partial<BaseInventory>) {
    this.inventoryId = data.inventoryId;
    this.type = data.type ?? 'player';
    this.items = data.items ?? {};
    this.label = data.label ?? 'Player inventory';
    this.width = data.width ?? Config.Player_Width;
    this.height = data.height ?? Config.Player_Height;
    this.weight = data.weight ?? 0;
    this.maxWeight = data.maxWeight ?? Config.Player_MaxWeight;
    this.netId = data.netId;
    this.ownerId = data.ownerId;
    this.coords = data.coords;
    this.playerId = data.playerId;

    BaseInventory.instances[this.inventoryId] = this;
  }

  /**
   * Get a cached inventory from its unique inventory id.
   */
  static fromId<T extends BaseInventory>(this: new (...args: any[]) => T, inventoryId: string) {
    return BaseInventory.instances[inventoryId] as T;
  }

  /**
   * Sets slot ids in the inventory to reference the unique item id of the item they are holding.
   */
  public setSlotRefs(slots: number[], uniqueId?: number) {
    slots.forEach((slotId) => (uniqueId ? (this.items[slotId] = uniqueId) : delete this.items[slotId]));

    return true;
  }

  /**
   * Get an array containing all unique item ids contained in the inventory.
   */
  public itemIds() {
    return [...new Set(Object.values(this.items))];
  }

  /**
   * Get an array containing all InventoryItems in the inventory.
   */
  public mapItems() {
    return this.itemIds().map((uniqueId) => GetInventoryItem(uniqueId));
  }

  public getItemInSlot(slot: number) {
    return GetInventoryItem(this.items[slot]);
  }

  /**
   * Finds the next available slot for the item in the inventory.
   * @returns The next available slot or -1 if no slot is available.
   */
  public findAvailableSlot(item: InventoryItem) {
    for (let slot = 0; slot < this.width * this.height; slot++) {
      if (this.canHoldItem(item, slot)) return slot;

      const existingItem = this.getItemInSlot(slot);

      if (existingItem) {
        slot += existingItem.width - 1;
      }
    }

    return -1;
  }

  /**
   * Determines the slotIds that are occupied by an item.
   * @returns An array containing the slotIds that hold the item.
   */
  public getItemSlots(item: InventoryItem) {
    const slots: number[] = [];

    for (let y = 0; y < item.height; y++) {
      const offset = item.anchorSlot + y * this.width;

      for (let x = 0; x < item.width; x++) {
        slots.push(offset + x);
      }
    }

    return slots;
  }

  /**
   * Determines the slotIds that will be occupied by an item, starting from startSlot.
   * @returns An array containing the slotIds that can can hold the item.
   */
  public getSlotsForItem(item: InventoryItem, startSlot: number) {
    const slots: number[] = [];

    for (let y = 0; y < item.height; y++) {
      const offset = startSlot + y * this.width;

      for (let x = 0; x < item.width; x++) {
        const slotId = offset + x;
        const doesItemOverlap = this.items[slotId] && this.items[slotId] !== item.uniqueId;
        const doesItemOverflow = Math.floor(slotId / this.width) !== Math.floor(offset / this.width);

        if (doesItemOverlap || doesItemOverflow) return false;

        slots.push(slotId);
      }
    }

    return slots;
  }

  /**
   * Determines if item placement is valid based on item size, inventory dimensions, weight, etc.
   */
  public canHoldItem(item: InventoryItem, startSlot: number, quantity?: number) {
    const existingItem = this.getItemInSlot(startSlot);
    quantity = quantity ? Math.max(1, Math.ceil(quantity)) : item.quantity;

    // todo: totalQuantity > itemLimit
    // todo: weight checks
    if (quantity > item.stackSize) return false;

    if (
      existingItem &&
      existingItem.anchorSlot === startSlot &&
      this.inventoryId === (existingItem.inventoryId ?? this.inventoryId)
    ) {
      if (!item.canMerge(existingItem)) return false;

      return this.getItemSlots(existingItem);
    }

    const doesItemFit =
      (startSlot % this.width) + item.width <= this.width &&
      Math.floor(startSlot / this.width) + item.height <= this.height;

    if (!doesItemFit) return false;

    return this.getSlotsForItem(item, startSlot);
  }
}
