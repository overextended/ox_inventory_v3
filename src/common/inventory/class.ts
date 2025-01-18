import { InventoryItem } from '@common/item';
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

  private iterateSlots(startSlot: number, item: InventoryItem, callback?: (slotId: number) => boolean) {
    // check if item dimensions exceed inventory boundaries
    if (
      (startSlot % this.width) + item.width > this.width ||
      Math.floor(startSlot / this.width) + item.height > this.height
    )
      return false;

    for (let y = 0; y < item.height; y++) {
      const offset = startSlot + y * this.width;

      for (let x = 0; x < item.width; x++) {
        const slotId = offset + x;

        if (
          slotId >= this.width * this.height || // slotId is out of range
          (this.items[slotId] && this.items[slotId] !== item.uniqueId) || // slots overlap another item
          Math.floor(slotId / this.width) !== Math.floor(offset / this.width) || // slots overflow into new row
          (callback && !callback(slotId))
        ) {
          return false;
        }
      }
    }

    return true;
  }

  public canMoveItem(startSlot: number, item: InventoryItem) {
    // todo: weight checks and such
    return this.iterateSlots(startSlot, item);
  }

  public moveItem(startSlot: number, item: InventoryItem) {
    if (!this.canMoveItem(startSlot, item)) return false;

    const currentSlot = item.anchorSlot;
    item.anchorSlot = startSlot;

    if (currentSlot)
      this.iterateSlots(currentSlot, item, (slotId) => {
        delete this.items[slotId];
        return true;
      });

    return this.iterateSlots(startSlot, item, (slotId) => {
      this.items[slotId] = item.uniqueId;
      return true;
    });
  }
}
