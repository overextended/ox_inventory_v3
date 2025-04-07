import { BaseInventory } from '@common/inventory/class';
import type { InventoryItem, ItemProperties } from '@common/item';
import db from '../db';
import { CreateItem, GetItemClass } from '../item';

const drops: string[] = [];

on('playerJoining', () => drops.length && emitNet('ox_inventory:addInventoryGrid', -1, drops));

export class Inventory extends BaseInventory {
  #openedBy: Map<number, string> = new Map();

  public entityId?: number;

  constructor(data: Partial<Inventory>) {
    super(data);
    this.entityId = data.entityId;

    if (data.type === 'drop') {
      drops.push(this.inventoryId);
      emitNet('ox_inventory:addInventoryGrid', -1, data);
    }

    const items = db.getInventoryItems(this.inventoryId);

    for (const data of items) {
      try {
        CreateItem(data);
      } catch (e) {
        data.quantity = 0;

        db.updateInventoryItem(data);
        console.error(`Invalid item '${data.name}' in inventory '${this.inventoryId}' was deleted.`);
      }
    }
  }

  /**
   * Get a cached inventory from its unique inventory id.
   */
  static FromId(inventoryId: string) {
    const inventory = BaseInventory.FromId(inventoryId) as Inventory;

    if (!inventory) return;

    if (inventory.entityId) {
      const isValid =
        DoesEntityExist(inventory.entityId) && NetworkGetNetworkIdFromEntity(inventory.entityId) === inventory.netId;

      const state = isValid && Entity(inventory.entityId).state;

      if (!state || state?.inventoryId !== inventory.inventoryId) {
        if (state) state.inventoryId = undefined;

        inventory.remove(true);
        return;
      }
    }

    return inventory;
  }

  static GetInventories(playerId?: number) {
    return Object.values(Inventory.instances as Record<string, Inventory>).filter((inventory) => {
      if (!playerId || inventory.#openedBy.has(playerId)) {
        return inventory;
      }
    });
  }

  /**
   * Emits an event to all players who are using this inventory.
   */
  public emit(event: string, ...args: any) {
    this.#openedBy.forEach((playerId) => emitNet(event, playerId, ...args));
  }

  /**
   * Optionally closes this inventory for all players and unloads it from the server.
   */
  public remove(closeAll = true) {
    if (this.type === 'drop') {
      const index = drops.indexOf(this.inventoryId);
      if (index > -1) drops.splice(index, 1);

      emitNet('ox_inventory:removeInventoryGrid', -1, this.inventoryId);
    }

    if (closeAll) this.closeAll();

    Inventory.Remove(this.inventoryId);
  }

  /**
   * Unloads this inventory from the server and optionally deletes its items from the database.
   */
  public delete(removeItems = false) {
    if (removeItems) db.deleteInventory(this.inventoryId);

    Inventory.Remove(this.inventoryId);
  }

  /**
   * Opens this inventory for a player.
   */
  public open(playerId: number) {
    if (this.getOpenState(playerId)) return;

    this.#openedBy.set(playerId, 'open');
    emitNet('ox_inventory:openInventory', playerId, { inventory: this, items: this.mapItems() });
  }

  /**
   * Opens this inventory for a player in view-only-mode.
   */
  public view(playerId: number) {
    this.#openedBy.set(playerId, 'view');
    emitNet('ox_inventory:openInventory', playerId, { inventory: this, items: this.mapItems(), viewOnly: true });
  }

  /**
   * Closes this inventory for a player.
   */
  public close(playerId: number, emit = true) {
    this.#openedBy.delete(playerId);

    if (emit) emitNet('ox_inventory:closeInventory', playerId);

    if (this.type === 'drop' && !this.#openedBy.size && Object.keys(this.items).length === 0) this.remove(false);
  }

  /**
   * Closes this inventory for all players.
   */
  public closeAll() {
    this.#openedBy.forEach((playerId) => emitNet('ox_inventory:closeInventory', playerId));
    this.#openedBy.clear();

    if (this.type === 'drop' && Object.keys(this.items).length === 0) this.remove(false);
  }

  /**
   * Checks if the inventory is open for the given player.
   */
  public getOpenState(playerId: number) {
    return this.#openedBy.get(playerId);
  }

  /**
   * Create an item and add it to this inventory, optionally merging with an existing item if requirements are met.
   */
  public addItem(data: ItemProperties): InventoryItem {
    const Item = GetItemClass(data.name);
    const item = new Item(data);
    item.inventoryId = this.inventoryId;

    const slots = this.canHoldItem(item, -1);

    if (!slots) throw new Error(`Cannot add item '${data.name}' to inventory '${this.inventoryId}'`);

    item.move(this, slots[0]);

    return item;
  }

  /**
   * Removes an item from this inventory, deleting the data entirely if the quantity reaches 0.
   */
  public removeItem(data: ItemProperties) {
    const items = this.mapItems();
    const matchedItems = [];
    data.quantity = data.quantity || 0;
    let quantity = data.quantity;

    for (const item of items) {
      if (item.match(data, false)) {
        matchedItems.push(item);

        if (quantity) {
          quantity -= item.quantity;

          if (quantity < 1) break;
        } else data.quantity += item.quantity;
      }
    }

    if (quantity > 0) return false;

    quantity = data.quantity;

    for (const item of matchedItems) {
      if (item.quantity > quantity) {
        item.quantity -= quantity;
        quantity = 0;

        item.move(this, item.anchorSlot);
      } else {
        quantity -= item.quantity;

        item.delete();
      }

      if (quantity < 1) break;
    }

    return true;
  }

  /**
   * Get the amount of an item this inventory can hold.
   */
  public getCarryAmount() {
    return 0;
  }

  /**
   * Clears this inventory of all items that don't match the given itemIds.
   */
  public clear(keepItems?: number[]) {
    super.clear(keepItems);
    this.emit('ox_inventory:clearInventory', { inventoryId: this.inventoryId, keepItems });
  }

  /** Gives an item from one player's inventory to another player's inventory. */
  public giveItem() {
    return true;
  }

  public canHoldItem(item: InventoryItem, startSlot?: number, quantity?: number): false | number[] {
    GetItemClass(item.name);

    return super.canHoldItem(item, startSlot, quantity);
  }
}
