import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';
import type { InventoryState } from '$lib/state/inventory';
import type { Action } from 'svelte/action';

export const draggableWindow: Action<HTMLElement, { inventory: InventoryState }> = (node, { inventory }) => {
  let moving = false;
  let left =
    inventory.type === 'player'
      ? window.innerWidth / 2 - (SLOT_SIZE * inventory.width + SLOT_GAP) / 2
      : window.innerWidth / 16;
  let top =
    inventory.type === 'player'
      ? window.innerHeight / 2 - (SLOT_SIZE * inventory.height + SLOT_GAP) / 2
      : window.innerHeight / 16;

  const container = document.getElementById(`inventory-${inventory.inventoryId}`) as HTMLElement;

  while (true) {
    const element = document.elementFromPoint(left, top) as HTMLElement;

    if (!element || element.id === 'app' || element.dataset.slot) break;

    const rect = element.getBoundingClientRect();

    left = rect.right + 2;
    top = rect.top;
  }

  container.style.position = 'absolute';
  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
  container.style.userSelect = 'none';

  node.addEventListener('mousedown', () => {
    moving = true;
  });

  window.addEventListener('mousemove', (e) => {
    if (moving) {
      left += e.movementX;
      top += e.movementY;
      container.style.top = `${top}px`;
      container.style.left = `${left}px`;
    }
  });

  window.addEventListener('mouseup', () => {
    moving = false;
  });
};
