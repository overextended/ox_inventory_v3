<script lang="ts">
import DragPreview from '$lib/components/DragPreview.svelte';
import InventoryWindow from '$lib/components/InventoryWindow.svelte';
import ContextMenu from '$lib/components/context-menu/ContextMenu.svelte';
import ShopInventory from '$lib/components/shop/ShopInventory.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { SLOT_SIZE } from '$lib/constants/inventory';
import { CreateItem } from '$lib/helpers/create-item';
import { useNuiEvent } from '$lib/hooks/useNuiEvents';
import { contextMenu } from '$lib/state/context-menu.svelte';
import { type DragItemType, InventoryState } from '$lib/state/inventory';
import { tooltip } from '$lib/state/tooltip.svelte';
import { debugData } from '$lib/utils/debugData';
import { fetchNui } from '$lib/utils/fetchNui';
import { isEnvBrowser } from '$lib/utils/misc';
import type { BaseInventory } from '@common/inventory/class';
import { GetInventoryItem, type InventoryItem } from '@common/item';
import { data } from 'autoprefixer';
import type { Component } from 'svelte';

type OpenInventories = {
  inventory: InventoryState;
  items: Partial<InventoryItem>[];
}[];

let visible = $state(false);
const keyPressed = { shift: false, control: false, alt: false };
let openInventories = $state<OpenInventories>([]);
const inventoryCount = $derived(openInventories.length - 1);
let playerId = $state(0);

$effect(() => {
  if (visible) return;
  if (tooltip.visible) tooltip.close();
  if (contextMenu.visible) contextMenu.close();
  if (isDragging) resetDragState();
});

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
            label: '9mm',
            description: 'Standard ammunition for pistols and SMGs, offering balanced power and reliability.',
          },
          {
            name: 'heavypistol',
            quantity: 1,
            inventoryId: 'player:0',
            uniqueId: 8,
            anchorSlot: 4,
            durability: 34,
            label: 'Heavy Pistol',
            description: 'A high-powered sidearm with strong recoil and devastating stopping power.',
            ingredients: 'Mustard, Ketchup, Beef',
            plate: 'XYZ123XD',
          },
        ],
      },
    },
    {
      action: 'openInventory',
      data: {
        inventory: {
          inventoryId: 'some-shop',
          type: 'shop',
          items: {
            0: 11,
            1: 12,
          },
          height: 5,
          width: 8,
          label: "Joe's 24/7 Convenience Store",
        },
        items: [
          {
            name: 'heavyrifle',
            quantity: 1,
            inventoryId: 'some-shop',
            uniqueId: 11,
            anchorSlot: 0,
            durability: 90,
            label: 'Heavy Rifle',
            description: 'A high-caliber rifle with devastating power, perfect for mid-to-long-range combat.',
            plate: 'XYZ123XD',
            price: 1500,
          },
          {
            name: 'ammo_9',
            quantity: 1,
            inventoryId: 'some-shop',
            uniqueId: 12,
            anchorSlot: 1,
            label: '9mm',
            description: 'The usual refreshing drink.',
            price: 12,
          },
        ],
      },
    },
  ],
  1000,
);

debugData<Record<string, string>>([
  {
    action: 'displayMetadata',
    data: {
      plate: 'Plate',
      ingredients: 'Ingredients',
    },
  },
]);

// debugData<Partial<InventoryItem>[]>(
//   [
//     {
//       action: 'updateItem',
//       data: [
//         {
//           name: 'HeavyRifle',
//           quantity: 1,
//           inventoryId: 'player:0',
//           uniqueId: 11,
//           anchorSlot: 37,
//           durability: 90,
//           label: 'Heavy Rifle',
//           description: 'A high-caliber rifle with devastating power, perfect for mid-to-long-range combat.',
//           plate: 'XYZ123XD',
//         },
//       ],
//     },
//   ],
//   1500,
// );

useNuiEvent('openInventory', async (data: { inventory: InventoryState; items: InventoryItem[]; playerId: number }) => {
  if (!playerId) playerId = data.playerId;

  let inventory = getInventoryById(data.inventory.inventoryId);

  if (inventory) inventory.items = data.inventory.items;
  else {
    inventory = new InventoryState(data.inventory);
    openInventories.push({ inventory, items: data.items });
  }

  for (const value of data.items) {
    let item: InventoryItem = GetInventoryItem(value.uniqueId);

    if (item) {
      // todo: figure out why this is so scuffed
      const oldInventory =
        item.inventoryId && item.inventoryId !== data.inventory.inventoryId && InventoryState.FromId(item.inventoryId);

      item.delete();

      if (oldInventory) oldInventory.refreshSlots();
    }

    item = await CreateItem(value);

    if (typeof item.ammoName === 'string') {
      await CreateItem({ name: item.ammoName });
    }

    item.move(inventory, item.anchorSlot);
  }

  inventory.refreshSlots();
  visible = true;
});

useNuiEvent('updateItem', async (items: InventoryItem[]) => {
  const inventories: Set<InventoryState> = new Set();

  for (const data of items) {
    const item = GetInventoryItem(data.uniqueId);
    const inventory = InventoryState.FromId(data.inventoryId);

    if (inventory) inventories.add(inventory);

    if (!item) {
      const newItem: InventoryItem = await CreateItem(data);
      newItem.move(inventory, newItem.anchorSlot);
      continue;
    }

    if (item.inventoryId !== data.inventoryId || item.rotate !== data.rotate || item.anchorSlot !== data.anchorSlot) {
      const oldInventory = InventoryState.FromId(item.inventoryId);

      if (oldInventory) inventories.add(oldInventory);

      item.delete();

      if (!inventory) continue;

      // todo: figure out why we can't reuse the existing item :sadge:
      const newItem: InventoryItem = await CreateItem(data);
      newItem.move(inventory, newItem.anchorSlot);
    }
  }

  for (const inventory of inventories) inventory.refreshSlots();
});

useNuiEvent('clearInventory', (data: { inventoryId: string; keepItems?: number[] }) => {
  const inventory = InventoryState.FromId(data.inventoryId);

  if (!inventory) return;

  inventory.clear(data.keepItems);
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

useNuiEvent('displayMetadata', (data: Record<string, string>) => {
  tooltip.displayMetadata = { ...tooltip.displayMetadata, ...data };
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

const SPECIAL_INVENTORIES: Record<string, Component> = {
  // @ts-ignore TODO: figure out later
  shop: ShopInventory,
};

function getSpecialInventory(data: OpenInventories | InventoryState) {
  const inventories = Array.isArray(data) ? data.map(({ inventory }) => inventory) : [data];
  let specialInventory = null;

  for (const inventory of inventories) {
    if (SPECIAL_INVENTORIES[inventory.type as keyof typeof SPECIAL_INVENTORIES]) {
      specialInventory = inventory;
      break;
    }
  }

  return specialInventory;
}
</script>

<svelte:window onmouseup={onMouseUp} onkeydown={onKeyDown} onkeyup={onKeyUp} ondragstart={preventDefault} />

<Tooltip />
<DragPreview bind:dragImg bind:dropIndicator {dragItem} />
<ContextMenu />


{#if getSpecialInventory(openInventories)}
  {@const inventory = getSpecialInventory(openInventories)}

  {#if inventory}
    {@const Component = SPECIAL_INVENTORIES[inventory.type]};
    <Component {inventory} itemState={inventory.itemState}/>
  {/if}
{:else}
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
{/if}



