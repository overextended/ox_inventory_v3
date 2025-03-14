import { BaseItem, GetItemData, type InventoryItem, ItemFactory, type ItemProperties } from '@common/item';
import db from '../db';
import { Inventory } from '../inventory/class';

const itemMove = BaseItem.prototype.move;
const itemSplit = BaseItem.prototype.split;
const itemDelete = BaseItem.prototype.delete;

BaseItem.prototype.CreateUniqueId = (item: InventoryItem): number => db.updateInventoryItem(item);

BaseItem.prototype.move = function (inventory: Inventory) {
  if (!this.uniqueId) {
    db.updateInventoryItem(this);
    this.cache();
  }

  const currentInventory = Inventory.FromId(this.inventoryId);
  const targetInventory = Inventory.FromId(inventory.inventoryId);
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

BaseItem.prototype.split = function (inventory: Inventory) {
  const currentInventory = Inventory.FromId(this.inventoryId);
  const targetInventory = Inventory.FromId(inventory.inventoryId);
  const newItem = itemSplit.apply(this, arguments) as ReturnType<typeof itemSplit>;

  if (newItem) {
    db.updateInventoryItem(this);
    db.updateInventoryItem(newItem);
    newItem.cache();
    currentInventory.emit('ox_inventory:moveItem');
    currentInventory.invalidateCache();

    if (currentInventory !== targetInventory) {
      targetInventory.emit('ox_inventory:moveItem');
      targetInventory.invalidateCache();
    }
  }

  return newItem;
};

BaseItem.prototype.delete = function () {
  const currentInventory = Inventory.FromId(this.inventoryId);

  itemDelete.apply(this);
  db.updateInventoryItem(this);

  currentInventory.emit('ox_inventory:moveItem');
  currentInventory.invalidateCache();
};

db.getItems('ammo').forEach(CreateItemClass);

function CreateItemClass(data: ItemProperties) {
  const Item = ItemFactory(data);

  if (!Item) return;

  GlobalState.set(`Item:${Item.name.toLowerCase()}`, Item.properties, true);

  return Item;
}

export function GetItemClass(name: string) {
  const Item = GetItemData(name) ?? CreateItemClass(db.getItem(name));

  if (!Item) throw new Error(`Attempted to create invalid item ${name}`);

  return Item;
}

export function CreateItem(data = {} as Partial<ItemProperties>) {
  const Item = GetItemClass(data.name);

  if (!data.uniqueId) db.updateInventoryItem(data);

  const item = new Item(data);
  const inventory = Inventory.FromId(data.inventoryId);

  if (inventory) item.move(inventory, item.anchorSlot);

  return item;
}
