import { GetInventory } from './inventory';
import { Command } from '@nativewrappers/server';

new Command(
  'additem',
  'Create a new item and grant it to the target player.',
  (args) => {
    const inventory = GetInventory(args.target);

    if (!inventory) return;

    inventory.addItem({ name: args.item, quantity: args.quantity || 1 });
  },
  [
    {
      name: 'target',
      type: 'playerId',
    },
    {
      name: 'item',
      type: 'string',
    },
    {
      name: 'quantity',
      type: 'number',
      optional: true,
    },
  ] as const,
);

new Command(
  'removeitem',
  'Reduce the quantity of an item from the target player.',
  (args) => {
    const inventory = GetInventory(args.target);

    if (!inventory) return;

    inventory.removeItem({ name: args.item, quantity: args.quantity });
  },
  [
    {
      name: 'target',
      type: 'playerId',
    },
    {
      name: 'item',
      type: 'string',
    },
    {
      name: 'quantity',
      type: 'number',
      optional: true,
    },
  ] as const,
);

new Command(
  'clearitems',
  "Clears all items from the target player's inventory.",
  (args) => {
    const inventory = GetInventory(args.target);

    if (!inventory) return;

    if (args.keep) {
      const keepItems = inventory
        .mapItems()
        .filter((item) => args.keep.includes(item.name))
        .map((item) => item.uniqueId);

      return inventory.clear(keepItems);
    }

    inventory.clear();
  },
  [
    {
      name: 'target',
      type: 'playerId',
    },
    {
      name: 'keep',
      type: 'longString',
    },
  ] as const,
);
