import { GetItemData, InventoryItem, ItemFactory, ItemProperties } from '@common/item';
import { GetDbItemData } from '../db';
import kvp, { AddInventoryItem, UpdateInventoryItem, UpdateInventoryItems } from '../kvp';
import { Inventory } from '../inventory/class';

export async function CreateItem(name: string, data = {} as Partial<ItemProperties>) {
  let Item = GetItemData(name);

  if (!Item) {
    Item = ItemFactory(name, await GetDbItemData(name));
    const itemMove = Item.prototype.move;
    const itemSplit = Item.prototype.split;

    Item.CreateUniqueId = function (item: InventoryItem): number {
      return AddInventoryItem(item.name, item).uniqueId;
    };

    Item.prototype.move = function (inventory: Inventory) {
      const currentInventory = Inventory.fromId(this.inventoryId);
      const targetInventory = Inventory.fromId(inventory.inventoryId);
      const success = itemMove.apply(this, arguments) as ReturnType<typeof itemMove>;

      if (success) {
        if (!currentInventory.isTemporary) UpdateInventoryItems(currentInventory);

        UpdateInventoryItem(this.uniqueId, this);
        currentInventory.emit(`ox_inventory:moveItem`);

        // todo: optimise
        if (currentInventory !== targetInventory) {
          if (!targetInventory.isTemporary) UpdateInventoryItems(targetInventory);

          targetInventory.emit(`ox_inventory:moveItem`);
        }

        kvp.flush();
      }

      return success;
    };

    Item.prototype.split = function (inventory: Inventory) {
      const currentInventory = Inventory.fromId(this.inventoryId);
      const targetInventory = Inventory.fromId(inventory.inventoryId);
      const newItem = itemSplit.apply(this, arguments) as ReturnType<typeof itemSplit>;

      if (newItem) {
        UpdateInventoryItem(this.uniqueId, this);
        UpdateInventoryItem(newItem.uniqueId, newItem);

        UpdateInventoryItems(currentInventory);
        currentInventory.emit(`ox_inventory:moveItem`);

        // todo: optimise
        if (currentInventory !== targetInventory) {
          UpdateInventoryItems(targetInventory);
          targetInventory.emit(`ox_inventory:moveItem`);
        }

        kvp.flush();
      }

      return newItem;
    };

    GlobalState.set(`Item:${Item.properties.name}`, Item.properties, true);
  }

  if (!data.uniqueId) AddInventoryItem(name, data as InventoryItem);

  const item = new Item(data);
  const inventory = Inventory.fromId(data.inventoryId);

  if (inventory) item.move(inventory, item.anchorSlot ?? 0);

  return item;
}
