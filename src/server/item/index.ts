import { GetItemData, type InventoryItem, ItemFactory, type ItemProperties } from '@common/item';
import db from '../db';
import { Inventory } from '../inventory/class';

db.getItems('ammo').forEach(CreateItemClass);

function CreateItemClass(data: ItemProperties) {
  const Item = ItemFactory(data);
  const itemMove = Item.prototype.move;
  const itemSplit = Item.prototype.split;

  GlobalState.set(`Item:${Item.properties.name.toLowerCase()}`, Item.properties, true);

  Item.CreateUniqueId = (item: InventoryItem): number => db.updateInventoryItem(item);

  Item.prototype.move = function (inventory: Inventory) {
    const currentInventory = Inventory.fromId(this.inventoryId);
    const targetInventory = Inventory.fromId(inventory.inventoryId);
    const success = itemMove.apply(this, arguments) as ReturnType<typeof itemMove>;

    if (success) {
      // todo: don't trigger save on initial item movement
      db.updateInventoryItem(this);
      currentInventory.emit('ox_inventory:moveItem');
      currentInventory.invalidateCache();

      if (currentInventory !== targetInventory) {
        targetInventory.emit('ox_inventory:moveItem');
        targetInventory.invalidateCache();
      }
    }

    return success;
  };

  Item.prototype.split = function (inventory: Inventory) {
    const currentInventory = Inventory.fromId(this.inventoryId);
    const targetInventory = Inventory.fromId(inventory.inventoryId);
    const newItem = itemSplit.apply(this, arguments) as ReturnType<typeof itemSplit>;

    if (newItem) {
      db.updateInventoryItem(this);
      db.updateInventoryItem(newItem);
      currentInventory.emit('ox_inventory:moveItem');
      currentInventory.invalidateCache();

      if (currentInventory !== targetInventory) {
        targetInventory.emit('ox_inventory:moveItem');
        targetInventory.invalidateCache();
      }
    }

    return newItem;
  };

  return Item;
}

export function CreateItem(data = {} as Partial<ItemProperties>) {
  const Item = GetItemData(data.name) ?? CreateItemClass(db.getItem(data.name));

  if (!Item) throw new Error(`Attempted to create invalid item ${data.name}`);

  if (!data.uniqueId) db.updateInventoryItem(data);

  const item = new Item(data);
  const inventory = Inventory.fromId(data.inventoryId);

  if (inventory) item.move(inventory, item.anchorSlot);

  return item;
}
