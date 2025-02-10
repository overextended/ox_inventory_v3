import Config from '@common/config';
import { GetInventoryItem } from '@common/item';
import { Vector3 } from '@nativewrappers/fivem';

export class BaseInventory {
  private static instances: Record<string, BaseInventory> = {};
  /** A unique identifier used to reference the inventory and save it in the database. */
  readonly inventoryId: string;

  /** The inventory type, such as player, glovebox, trunk, etc. */
  readonly type: string;

  /** An object where each key-value refers to the grid position and an item's uniqueid in that slot. */
  readonly items: Record<number, number> = {};

  public label: string;
  public width: number;
  public height: number;
  public weight: number;
  public maxWeight: number;
  public netId?: number;
  public ownerId?: string;
  public coords?: Vector3;

  constructor(data: any) {
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

    BaseInventory.instances[this.inventoryId] = this;
  }

  static fromId<T extends BaseInventory>(this: new (...args: any[]) => T, inventoryId: string) {
    return BaseInventory.instances[inventoryId] as T;
  }

  public setSlotRefs(slots: number[], uniqueId?: number) {
    slots.forEach((slotId) => (uniqueId ? (this.items[slotId] = uniqueId) : delete this.items[slotId]));
  }

  public itemIds() {
    return [...new Set(Object.values(this.items))];
  }

  public mapItems() {
    return this.itemIds().map((uniqueId) => GetInventoryItem(uniqueId));
  }
}
