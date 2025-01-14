import { InventoryItem } from '@common/itemFactory';
import { Vector3 } from '@nativewrappers/fivem';

export class BaseInventory {
  /** A unique identifier used to reference the inventory and save it in the database. */
  readonly inventoryId: string;

  /** The inventory type, such as player, glovebox, trunk, etc. */
  readonly type: string;

  /** An object where each key-value refers to the grid position and an item's uniqueid in that slot. */
  readonly items: Record<number, string>;

  public label: string;
  public width: number;
  public height: number;
  public weight: number;
  public maxWeight: number;
  public netId?: number;
  public ownerId?: string;
  public coords?: Vector3;

  constructor(data: any) {
    Object.assign(this, data);
  }

  private iterateSlots(startSlot: number, item: InventoryItem, callback: (slotId: number) => boolean) {
    for (let y = 0; y < item.height; y++) {
      for (let x = 0; x < item.width; x++) {
        const slotId = startSlot + y * this.width + x;

        if (
          slotId >= this.width * this.height ||
          Math.floor(slotId / this.width) !== Math.floor((startSlot + y * this.width) / this.width) ||
          !callback(slotId)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  public canMoveItem(startSlot: number, item: InventoryItem) {
    return this.iterateSlots(
      startSlot,
      item,
      (slotId) => slotId < this.width * this.height && (!this.items[slotId] || this.items[slotId] === item.uniqueId)
    );
  }

  public moveItem(startSlot: number, item: InventoryItem) {
    return this.iterateSlots(startSlot, item, (slotId) => {
      this.items[slotId] = item.uniqueId;
      return true;
    });
  }
}
