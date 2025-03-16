import { tooltip } from '$lib/state/tooltip.svelte';
import type { InventoryItem } from '@common/item';
import type { Action } from 'svelte/action';

export const itemTooltip: Action<HTMLElement, { item: InventoryItem }> = (node, { item }) => {
  let timer: NodeJS.Timeout | null = null;

  const openTooltip = () => {
    const element = node.getBoundingClientRect();

    const x = element.x + element.width;
    const y = element.y + element.height;

    tooltip.open({
      x,
      y,
      item,
    });
  };

  node.addEventListener('mouseenter', () => {
    timer = setTimeout(openTooltip, 100);
  });

  node.addEventListener('mouseleave', () => {
    tooltip.close();

    if (!timer) return;

    clearTimeout(timer);
    timer = null;
  });
};
