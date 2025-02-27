import { addCommand } from '@overextended/ox_lib/server';
import { GetInventory } from './inventory';
import { CreateItem } from './item';

addCommand(
  'additem',
  async (playerId, args) => {
    const inventory = GetInventory(args.target as number);

    if (!inventory) return;

    CreateItem(args.item as string, { inventoryId: inventory.inventoryId, quantity: (args.quantity as number) || 1 });
  },
  {
    help: 'Create a new item and grant it to the target player.',
    params: [
      {
        name: 'target',
        paramType: 'playerId',
      },
      {
        name: 'item',
        paramType: 'string',
      },
      {
        name: 'quantity',
        paramType: 'number',
        optional: true,
      },
    ],
    restricted: 'group.admin',
  }
);
