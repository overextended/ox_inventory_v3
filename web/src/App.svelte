<script lang="ts">
import { isEnvBrowser } from '$lib/utils/misc';
import { type InventoryItem, GetInventoryItem } from '@common/item';
import type { BaseInventory } from '@common/inventory/class';
import { useNuiEvent } from '$lib/hooks/useNuiEvents';
import { debugData } from '$lib/utils/debugData';
import { fetchNui } from '$lib/utils/fetchNui';
import { type DragItemType, InventoryState } from '$lib/state/inventory';
import { CreateItem } from '$lib/helpers/create-item';
import { SLOT_SIZE } from '$lib/constants/inventory';
import DragPreview from '$lib/components/DragPreview.svelte';
import InventoryWindow from '$lib/components/InventoryWindow.svelte';
import ContextMenu from '$lib/components/context-menu/ContextMenu.svelte';
import { contextMenu } from '$lib/state/context-menu.svelte';

let visible = $state(false);
const keyPressed = { shift: false, control: false, alt: false };
let openInventories = $state<{ inventory: InventoryState; items: Partial<InventoryItem>[] }[]>([]);
const inventoryCount = $derived(openInventories.length - 1);
let playerId = $state(0);

debugData<{ inventory: Partial<BaseInventory>; items: Partial<InventoryItem>[] }>(
  [
    {
      action: 'openInventory',
      data: {
        inventory: {
          inventoryId: 'player:0',
          label: 'Inventory',
          items: {
            0: 7,
            4: 8,
          },
          width: 12,
          height: 8,
        },
        items: [
          {
            name: 'ammo_9',
            quantity: 7,
            inventoryId: 'player:0',
            uniqueId: 7,
            anchorSlot: 0,
          },

          {
            name: 'HeavyPistol',
            quantity: 1,
            inventoryId: 'player:0',
            uniqueId: 8,
            anchorSlot: 4,
            durability: 34,
          },
        ],
      },
    },
    {
      action: 'openInventory',
      data: {
        inventory: {
          inventoryId: 'trunk',
          items: {
            0: 11,
          },
          height: 5,
          width: 8,
          label: 'Trunk',
        },
        items: [
          {
            name: 'HeavyRifle',
            quantity: 1,
            inventoryId: 'trunk',
            uniqueId: 11,
            anchorSlot: 0,
            durability: 90,
          },
        ],
      },
    },
  ],
  1000,
);

useNuiEvent('openInventory', async (data: { inventory: InventoryState; items: InventoryItem[]; playerId: number }) => {
  if (!playerId) playerId = data.playerId;

  let inventory = getInventoryById(data.inventory.inventoryId);

  if (inventory) inventory.items = data.inventory.items;
  else {
    inventory = new InventoryState(data.inventory);
    openInventories.push({ inventory, items: data.items });
  }

  for (const value of data.items) {
    let item = GetInventoryItem(value.uniqueId);

    if (item) {
      // todo: figure out why this is so scuffed
      const oldInventory =
        item.inventoryId && item.inventoryId !== data.inventory.inventoryId && InventoryState.FromId(item.inventoryId);

      item.delete();

      if (oldInventory) oldInventory.refreshSlots();
    }

    item = (await CreateItem(value)) as InventoryItem;

    if (typeof item.ammoName === 'string') {
      await CreateItem({ name: item.ammoName });
    }

    item.move(inventory, item.anchorSlot);
  }

  inventory.refreshSlots();
});

useNuiEvent('closeInventory', (inventoryId: string) => {
  if (inventoryId) {
    openInventories = openInventories.filter((openInventory) => openInventory.inventory.inventoryId !== inventoryId);
    return;
  }

  visible = false;
  openInventories = [];
});

if (isEnvBrowser()) {
  const root = document.getElementById('app');

  // https://i.imgur.com/iPTAdYV.png - Night time img
  root!.style.backgroundImage = 'url("https://i.imgur.com/3pzRj9n.png")';
  root!.style.backgroundSize = 'cover';
  root!.style.backgroundRepeat = 'no-repeat';
  root!.style.backgroundPosition = 'center';
}

let isDragging = $state(false);
let dragSlot = $state<number | null>(null);
let dragItem = $state<DragItemType | null>(null);
let dragImg: HTMLElement = $state(null)!;
let dropIndicator: HTMLElement = $state(null)!;

function getDragItemProps({
  anchorSlot,
  rotate,
  uniqueId,
  inventoryId,
  quantity,
  height,
  width,
  icon,
}: InventoryItem): DragItemType {
  return {
    uniqueId,
    rotate,
    inventoryId,
    height,
    anchorSlot,
    width,
    icon,
    quantity,
  };
}

function getInventoryById(inventoryId: string) {
  return openInventories.find((openInventory) => openInventory.inventory.inventoryId === inventoryId)?.inventory;
}

function onMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (isDragging || !target?.dataset.slot) return;

  const parent = target.parentNode!.parentNode as HTMLElement;

  if (!parent.dataset.inventoryid) return;

  const sourceInventory = getInventoryById(parent.dataset.inventoryid as string);

  if (!sourceInventory) return;

  const slot = +target.dataset.slot;
  const item = slot !== null && sourceInventory.getItemInSlot(slot);

  if (!item) return;

  if (event.button === 0) {
    if (keyPressed.alt) {
      // prompt for amount of item to split from the stack (should this be on drop?)
    } else if (keyPressed.control) {
      // quick-move item to player inventory?
    }

    isDragging = true;
    dragSlot = slot;
    dragItem = getDragItemProps(item);
  }
}

function resetDragState() {
  if (!dragItem) return;

  isDragging = false;
  dragSlot = null;
  dragItem = null;
  document.body.style.cursor = 'auto';
}

function onItemMovement(
  item: InventoryItem,
  fromInventory: InventoryState,
  toInventory: InventoryState,
  quantity: number,
  slot: number,
) {
  if (!isEnvBrowser()) return;

  const result = quantity !== item.quantity ? item.split(toInventory, quantity, slot) : item.move(toInventory, slot);

  if (typeof result === 'object') Object.assign(item, result);

  fromInventory.refreshSlots();

  if (fromInventory !== toInventory) toInventory.refreshSlots();
}

function getSlotIdFromPoint(x: number, y: number, item: InventoryItem) {
  const element = document.elementFromPoint(
    x - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
    y - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
  ) as HTMLElement | null;

  return element?.dataset.slot ? +element.dataset.slot : null;
}

async function onMouseUp(event: MouseEvent) {
  if (!isDragging || !dragItem || event.button !== 0) return;

  try {
    const fromInventory = getInventoryById(dragItem.inventoryId!);

    if (!fromInventory) throw new Error(`Cannot move item from unknown inventory (${dragItem.inventoryId})`);

    const item = fromInventory.getItemInSlot(dragItem.anchorSlot!);
    const top = +dropIndicator.style.top.slice(0, -2) + (item.height * SLOT_SIZE) / 2;
    const left = +dropIndicator.style.left.slice(0, -2) + (item.width * SLOT_SIZE) / 2;
    const target = document.elementFromPoint(left, top) as HTMLElement;
    const parent = target.parentNode! as HTMLElement;
    const targetInventoryId = parent?.dataset?.inventoryid || 'drop';

    const quantity = Math.max(
      1,
      Math.min(item.quantity, keyPressed.shift ? Math.floor(item.quantity / 2) : item.quantity),
    );

    if (targetInventoryId === 'drop' && isEnvBrowser()) {
      debugData<{ inventory: Partial<BaseInventory>; items: Partial<InventoryItem>[] }>(
        [
          {
            action: 'openInventory',
            data: {
              inventory: {
                inventoryId: targetInventoryId,
                label: 'Drop',
                width: 6,
                height: 4,
                maxWeight: 50000,
                type: 'drop',
                items: {},
              },
              items: [],
            },
          },
        ],
        0,
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const toInventory = getInventoryById(targetInventoryId);
    const slot = targetInventoryId === 'drop' ? 0 : getSlotIdFromPoint(left, top, item);

    if (typeof slot !== 'number') throw new Error(`Cannot move item to invalid slot (${slot})`);

    if (fromInventory === toInventory && item.anchorSlot === slot) return;

    item.tempRotate = dragItem.rotate;

    const success = await fetchNui(
      'moveItem',
      {
        fromType: fromInventory.type,
        toType: toInventory?.type || 'drop',
        fromId: fromInventory.inventoryId,
        toId: toInventory?.inventoryId,
        fromSlot: item.anchorSlot,
        toSlot: slot,
        rotate: item.tempRotate,
        quantity,
      },
      {
        data: true,
      },
    );

    if (success) {
      if (toInventory) onItemMovement(item, fromInventory, toInventory, quantity, slot);
    }
  } catch (err: any) {
    console.error(`Error during moveItem: ${err.message}`);
  } finally {
    resetDragState();
  }
}

function onKeyDown(event: KeyboardEvent) {
  const key = event.key.toLowerCase();

  switch (key) {
    case 'escape':
    case 'tab':
      return fetchNui('closeInventory');
    case 'r': {
      if (!dragItem || dragItem.width === dragItem.height) return;

      const temp = dragItem.width;
      dragItem.width = dragItem.height;
      dragItem.height = temp;
      dragItem.rotate = !dragItem.rotate;

      return;
    }
    case 'control':
    case 'shift':
    case 'alt':
      return (keyPressed[key] = true);
  }
}

function onKeyUp(event: KeyboardEvent) {
  const key = event.key.toLowerCase() as keyof typeof keyPressed;

  if (keyPressed[key]) keyPressed[key] = false;
}

const preventDefault = (event: KeyboardEvent | MouseEvent) => event.preventDefault();
</script>

<svelte:window onmouseup={onMouseUp} onkeydown={onKeyDown} onkeyup={onKeyUp} ondragstart={preventDefault} />

<DragPreview bind:dragImg bind:dropIndicator {dragItem} />
<ContextMenu />

{#each openInventories as { inventory }}
  <InventoryWindow
    visible
    {isDragging}
    {dragItem}
    {inventory}
    itemState={inventory.itemState}
    {onMouseDown}
    {inventoryCount}
    {playerId}
  />
{/each}
