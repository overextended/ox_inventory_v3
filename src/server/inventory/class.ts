import { BaseInventory } from '@common/inventory/class';

export class Inventory extends BaseInventory {
  public openedBy: Record<number, true>;

  constructor(data: any) {
    super(data);
    this.openedBy = {};
  }
}
