import { BaseInventory } from '~/src/common/inventory/class';
import { writable } from 'svelte/store';
import type { InventoryItem } from '@common/item';

export class InventoryState extends BaseInventory {
  itemState = writable<Array<InventoryItem | null>>([]);

  constructor(data: Partial<BaseInventory>) {
    super(data);
  }

  refreshSlots() {
    this.itemState.set(Array.from({ length: this.width * this.height }).map((_, index) => this.getItemInSlot(index)));
  }
}

export interface DragItemType {
  width: InventoryItem['width'];
  height: InventoryItem['height'];
  anchorSlot: InventoryItem['anchorSlot'];
  uniqueId: InventoryItem['uniqueId'];
  inventoryId: InventoryItem['inventoryId'];
  rotate: InventoryItem['rotate'];
  icon: InventoryItem['icon'];
  quantity: InventoryItem['quantity'];
}
