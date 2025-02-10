import { GetItemData, InventoryItem, ItemFactory } from '@common/item';
import { GetDbItemData } from '../db';
import kvp, { AddInventoryItem, UpdateInventoryItem } from '../kvp';
import { Inventory } from '../inventory/class';

export async function CreateItem(name: string, data = {} as Partial<InventoryItem>) {
  let Item = GetItemData(name);

  if (!Item) {
    Item = ItemFactory(name, await GetDbItemData(name));
    const itemMove = Item.prototype.move;

    Item.prototype.move = function (inventory: Inventory) {
      const currentInventory = Inventory.fromId(this.inventoryId);
      const targetInventory = Inventory.fromId(inventory.inventoryId);
      const success = itemMove.apply(this, arguments) as ReturnType<typeof itemMove>;

      if (success) {
        UpdateInventoryItem(this.uniqueId, this);

        kvp.setJson(`inventory_items.${currentInventory.inventoryId}`, currentInventory.itemIds(), true);

        // todo: optimise
        if (currentInventory !== targetInventory) {
          kvp.setJson(`inventory_items.${targetInventory.inventoryId}`, targetInventory.itemIds(), true);
        }

        kvp.flush();
      }

      return success;
    };

    GlobalState.set(`Item:${Item.properties.name}`, Item.properties, true);
  }

  if (!data.uniqueId) data = AddInventoryItem(name, data);

  const item = new Item(data);
  const inventory = Inventory.fromId(data.inventoryId);

  if (inventory) item.move(inventory, item.anchorSlot ?? 0);

  return item;
}
