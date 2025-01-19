import { Inventory } from './inventory/class';
import { CreateItem } from './item';

setTimeout(async () => {
  const inventory = new Inventory({
    inventoryId: 'test',
    type: 'player',
    label: 'Player inventory',
    width: 20,
    height: 20,
    weight: 0,
    maxWeight: 10000,
    items: {},
  });

  const item = await CreateItem('water');
  const item2 = await CreateItem('water');
  console.log(item);

  const canMove = item.canMove(inventory, 0);
  console.log('canMove', canMove);

  if (canMove) {
    const moved = item.move(inventory, 0);
    console.log('moved', moved)
  }

  const canMove2 = item2.canMove(inventory, 23);
  console.log('canMove2', canMove2);

  if (canMove2) {
    const moved = item2.move(inventory, 23);
    console.log('moved2', moved)
  }

  console.log(inventory);
}, 500);
