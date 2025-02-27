import { GetInventory } from './inventory';
import { CreateItem } from './item';
import { Command } from '@nativewrappers/common';

new Command(
  'additem',
  'Create a new item and grant it to the target player.',
  (args) => {
    const inventory = GetInventory(args.target);

    if (!inventory) return;

    CreateItem({ name: args.item, inventoryId: inventory.inventoryId, quantity: args.quantity || 1 });
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
  ] as const
);
