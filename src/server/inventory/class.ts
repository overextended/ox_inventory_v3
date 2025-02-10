import { BaseInventory } from '@common/inventory/class';

export class Inventory extends BaseInventory {
  #openedBy: Set<number>;

  constructor(data: any) {
    super(data);
    this.#openedBy = new Set();
  }

  public emit(event: string, args?: any) {
    this.#openedBy.forEach((playerId) => emitNet(event, playerId, args));
  }

  public open(playerId: number) {
    this.#openedBy.add(playerId);
    emitNet(`ox_inventory:openInventory`, playerId, { inventory: this, items: this.mapItems() });
  }

  public close(playerId: number) {
    this.#openedBy.delete(playerId);
    emitNet(`ox_inventory:closeInventory`, playerId);
  }
}
