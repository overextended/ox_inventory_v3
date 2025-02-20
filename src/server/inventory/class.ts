import { BaseInventory } from '@common/inventory/class';

export class Inventory extends BaseInventory {
  #openedBy: Set<number>;
  isTemporary = false;

  constructor(data: Partial<BaseInventory>) {
    super(data);
    this.#openedBy = new Set();

    if (data.type === 'drop') {
      this.isTemporary = true;

      emitNet('ox_inventory:createDrop', -1, data);
    }
  }

  public emit(event: string, args?: any) {
    this.#openedBy.forEach((playerId) => emitNet(event, playerId, args));
  }

  public open(playerId: number) {
    this.#openedBy.add(playerId);
    emitNet(`ox_inventory:openInventory`, playerId, { inventory: this, items: this.mapItems() });
  }

  public close(playerId: number, emit = true) {
    this.#openedBy.delete(playerId);

    if (emit) emitNet(`ox_inventory:closeInventory`, playerId);
  }
}
