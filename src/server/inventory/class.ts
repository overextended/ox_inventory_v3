import { BaseInventory } from '@common/inventory/class';
import { GetDbInventoryItems } from '../db';
import { CreateItem } from '../item';

export class Inventory extends BaseInventory {
  public openedBy: Record<number, true>;

  constructor(data: any) {
    super(data);
    this.openedBy = {};

    data.items ? Object.assign(this.items, data.items) : this.loadItems();
  }

  async loadItems() {
    const items = await GetDbInventoryItems(this.inventoryId);

    for (const data of items) {
      const name = data.name;
      const metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
      delete data.metadata;
      delete data.name;

      const item = await CreateItem(name, Object.assign(data, metadata));

      item.move(this, item.anchorSlot ?? 0);
    }
  }
}
