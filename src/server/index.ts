import { sleep } from '@overextended/ox_lib';
import { GetDbInventoryData } from './db';
import { Inventory } from './inventory/class';

setTimeout(async () => {
  const invData = await GetDbInventoryData('test');
  const inventory = new Inventory(invData);

  await sleep(100);

  // const newItem = await CreateItem('water', { inventoryId: 'test' });
  // console.log(newItem);

  // const moved = newItem.move(inventory, 4);
  // console.log('moved', moved);

  await sleep(100);

  console.log(inventory);
}, 500);
