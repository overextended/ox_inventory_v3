import { BaseInventory } from '@common/inventory/class';

const drops: string[] = [];

on('playerJoining', () => emitNet('ox_inventory:createDrop', -1, drops));

export class Inventory extends BaseInventory {
  #openedBy: Set<number>;
  isTemporary = false;

  constructor(data: Partial<BaseInventory>) {
    super(data);
    this.#openedBy = new Set();

    if (data.type === 'drop') {
      this.isTemporary = true;

      drops.push(this.inventoryId);
      emitNet('ox_inventory:createDrop', -1, data);
    }
  }

  static getInventories(playerId?: number) {
    return Object.values(Inventory.instances as Record<string, Inventory>).filter((inventory) => {
      if (!playerId || inventory.#openedBy.has(playerId)) {
        return inventory;
      }
    });
  }

  public emit(event: string, args?: any) {
    this.#openedBy.forEach((playerId) => emitNet(event, playerId, args));
  }

  public open(playerId: number) {
    this.#openedBy.add(playerId);
    emitNet('ox_inventory:openInventory', playerId, { inventory: this, items: this.mapItems() });
  }

  public close(playerId: number, emit = true) {
    this.#openedBy.delete(playerId);

    if (emit) emitNet('ox_inventory:closeInventory', playerId);

    if (this.type === 'drop' && !this.#openedBy.size && Object.keys(this.items).length === 0) {
      emitNet('ox_inventory:removeDrop', -1, this.inventoryId);
    }
  }
}
