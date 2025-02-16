import { BaseInventory } from '~/src/common/inventory/class';
import { writable } from 'svelte/store';

export class InventoryState extends BaseInventory {
  itemState = writable(this.items);

  constructor(data: Partial<BaseInventory>) {
    super(data);

    // @ts-ignore
    this.items = data.items;
  }

  refreshSlots() {
    this.itemState.set(Array.from({ length: this.width * this.height }).map((_, index) => this.getItemInSlot(index)));
  }
}
