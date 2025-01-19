import { Vector3 } from '@nativewrappers/fivem';

export class BaseInventory {
  private static instances: Record<string, BaseInventory> = {};
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
    BaseInventory.instances[this.inventoryId] = this;
  }

  static fromId<T extends BaseInventory>(this: new (...args: any[]) => T, inventoryId: string) {
    return BaseInventory.instances[inventoryId] as T;
  }
}
