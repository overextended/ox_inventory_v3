import { BaseInventory } from '@common/inventory/class';
import type { ItemProperties } from '@common/item';
import db from '../db';

const drops: string[] = [];

on('playerJoining', () => emitNet('ox_inventory:createDrop', -1, drops));

export class Inventory extends BaseInventory {
  #openedBy: Set<number>;

  constructor(data: Partial<BaseInventory>) {
    super(data);
    this.#openedBy = new Set();

    if (data.type === 'drop') {
      this.isTemporary = true;

      drops.push(this.inventoryId);
      emitNet('ox_inventory:createDrop', -1, data);
    }
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
  public emit(event: string, args?: any) {
    this.#openedBy.forEach((playerId) => emitNet(event, playerId, args));
  }

  /**
   * Optionally closes this inventory for all players and unloads it from the server.
   */
  public remove(closeAll = true) {
    if (closeAll) this.closeAll();

    if (this.type === 'drop') {
      const index = drops.indexOf(this.inventoryId);
      if (index > -1) drops.splice(index, 1);

      emitNet('ox_inventory:removeDrop', -1, this.inventoryId);
    }

    Inventory.Remove(this.inventoryId);
  }

  /**
   * Unloads this inventory from the server and deletes it from the database.
   */
  public delete(removeItems = false) {
    const success = db.deleteInventory(this.inventoryId, removeItems);

    if (success) Inventory.Remove(this.inventoryId);
  }

  /**
   * Opens this inventory for a player.
   */
  public open(playerId: number) {
    this.#openedBy.add(playerId);
    emitNet('ox_inventory:openInventory', playerId, { inventory: this, items: this.mapItems() });
  }

  /**
   * Opens this inventory for a player in view-only-mode.
   */
  public view(playerId: number) {
    this.#openedBy.add(playerId);
    emitNet('ox_inventory:openInventory', playerId, { inventory: this, items: this.mapItems() });
    // todo: make it actually view-only
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
   * Create an item and add it to this inventory, optionally merging with an existing item if requirements are met.
   */
  public addItem(item: ItemProperties) {}

  /**
   * Removes an item from this inventory, deleting the data entirely if the quantity reaches 0.
   */
  public removeItem(item: ItemProperties) {}

  /**
   * Determine if this inventory can hold the given items.
   */
  public canHoldItems() {}

  /**
   * Get the amount of an item this inventory can hold.
   */
  public getCarryAmount() {}

  /**
   * Clears this inventory of all items that don't match the given itemIds.
   */
  public clear(keepItems?: number[]) {}

  /** Gives an item from one player's inventory to another player's inventory. */
  public giveItem() {}
}
