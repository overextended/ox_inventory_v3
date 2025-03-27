import { Command } from '@nativewrappers/server';
import { GetInventory } from './inventory';

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

new Command(
  'testclothing',
  'Adds some clothing items to the target.',
  (args) => {
    const inventory = GetInventory(args.target);

    if (!inventory) return;

    inventory.addItem({
      name: 'ped_prop',
      quantity: 1,
      componentId: 0,
      collection: 'mp_m_bikerdlc_01',
      drawableId: 0,
      textureId: 0,
    });

    inventory.addItem({
      name: 'ped_prop',
      quantity: 1,
      componentId: 0,
      collection: 'mp_m_bikerdlc_01',
      drawableId: 2,
      textureId: 0,
    });

    inventory.addItem({
      name: 'ped_prop',
      quantity: 1,
      componentId: 0,
      collection: 'mp_f_bikerdlc_01',
      drawableId: 0,
      textureId: 0,
    });

    inventory.addItem({
      name: 'ped_component',
      quantity: 1,
      componentId: 11,
      collection: '',
      drawableId: 0,
      textureId: 0,
    });

    inventory.addItem({
      name: 'ped_component',
      quantity: 1,
      componentId: 11,
      collection: '',
      drawableId: 4,
      textureId: 0,
    });

    inventory.addItem({
      name: 'ped_component',
      quantity: 1,
      componentId: 11,
      collection: 'mp_m_bikerdlc_01',
      drawableId: 0,
      textureId: 0,
    });
  },
  [
    {
      name: 'target',
      type: 'playerId',
    },
  ] as const,
);
