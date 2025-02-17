<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { type InventoryItem, GetInventoryItem } from '@common/item';
  import { BaseInventory } from '@common/inventory/class';
  import { useNuiEvent } from '$lib/hooks/useNuiEvents';
  import { debugData } from '$lib/utils/debugData';
  import { fetchNui } from '$lib/utils/fetchNui';
  import { InventoryState } from '$lib/state/inventory';
  import { CreateItem } from '$lib/helpers/create-item';
  import { SLOT_SIZE } from '$lib/constants/inventory';
  import PlayerInventory from '$lib/components/PlayerInventory.svelte';
  import DragPreview from '$lib/components/DragPreview.svelte';
  import InventoryWindow from '$lib/components/InventoryWindow.svelte';

  let visible = $state(false);
  let isHoldingShift = false;
  let inventory = $state(
    new InventoryState({
      inventoryId: 'player',
      label: '',
      items: {},
      width: 2,
      height: 2,
    })
  );
  let { itemState } = $derived(inventory);
  let items = $state<Record<number, InventoryItem>>({});

  let openInventories = $state<{ inventory: InventoryState; items: Partial<InventoryItem>[] }[]>([]);

  debugData<{ inventory: Partial<BaseInventory>; items: Partial<InventoryItem>[] }>(
    [
      {
        action: 'openInventory',
        data: {
          inventory: {
            inventoryId: 'player',
            label: 'Inventory',
            items: {
              0: 7,
              4: 8,
            },
            width: 12,
            height: 6,
          },
          items: [
            {
              name: 'ammo_9',
              quantity: 7,
              inventoryId: 'player',
              uniqueId: 7,
              anchorSlot: 0,
            },

            {
              name: 'HeavyPistol',
              quantity: 1,
              inventoryId: 'player',
              uniqueId: 8,
              anchorSlot: 4,
            },
          ],
        },
      },
    ],
    1000
  );

  debugData<{ inventory: Partial<BaseInventory>; items: Partial<InventoryItem>[] }>(
    [
      {
        action: 'openInventoryWindow',
        data: {
          inventory: {
            inventoryId: 'glovebox',
            items: {
              1: 9,
            },
            height: 4,
            width: 4,
            label: 'Glovebox',
          },
          items: [
            {
              name: 'ammo_9',
              quantity: 1,
              inventoryId: 'glovebox',
              uniqueId: 9,
              anchorSlot: 1,
            },
          ],
        },
      },
    ],
    1000
  );

  useNuiEvent('openInventory', async (data: { inventory: BaseInventory; items: InventoryItem[] }) => {
    inventory = new InventoryState(data.inventory);

    for (const value of data.items) {
      const item: InventoryItem = GetInventoryItem(value.uniqueId) ?? (await CreateItem(value.name, value));
      items[item.uniqueId] = item;

      item.move(inventory, item.anchorSlot);
    }

    inventory.refreshSlots();

    visible = true;
  });

  useNuiEvent('openInventoryWindow', async (data: { inventory: InventoryState; items: InventoryItem[] }) => {
    let inventory = new InventoryState(data.inventory);

    for (const value of data.items) {
      const item: InventoryItem = GetInventoryItem(value.uniqueId) ?? (await CreateItem(value.name, value));
      items[item.uniqueId] = item;

      item.move(inventory, item.anchorSlot);
    }

    inventory.refreshSlots();

    openInventories.push({ inventory, items: data.items });
  });

  useNuiEvent('closeInventoryWindow', async (data: { inventoryId: string }) => {
    openInventories = openInventories.filter(
      (openInventory) => openInventory.inventory.inventoryId !== data.inventoryId
    );
  });

  useNuiEvent('closeAllInventories', () => {
    visible = false;
    openInventories = [];
  });

  useNuiEvent('closeInventory', () => (visible = false));

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
  let dragItem: InventoryItem | null = null;
  let dragImg: HTMLElement = $state(null)!;
  let dropIndicator: HTMLElement = $state(null)!;

  function updateDropIndicatorPosition(event: MouseEvent, item: InventoryItem) {
    const target = event.target as HTMLElement;
    const parent = target.parentNode as HTMLElement;

    if (!parent?.dataset?.inventoryid) {
      // todo: hide indicator / show outside drop?
      return;
    }

    const invRect = parent.getBoundingClientRect();
    const mouseX = event.clientX - invRect.left;
    const mouseY = event.clientY - invRect.top;

    const adjustedX = mouseX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2;
    const adjustedY = mouseY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2;

    const slotX = Math.max(
      0,
      Math.min(Math.floor(adjustedX / SLOT_SIZE), Math.floor(invRect.width / SLOT_SIZE) - item.width)
    );

    const slotY = Math.max(
      0,
      Math.min(Math.floor(adjustedY / SLOT_SIZE), Math.floor(invRect.height / SLOT_SIZE) - item.height)
    );

    const globalX = invRect.left + slotX * SLOT_SIZE;
    const globalY = invRect.top + slotY * SLOT_SIZE;

    dropIndicator.style.width = `${item.width * SLOT_SIZE}px`;
    dropIndicator.style.height = `${item.height * SLOT_SIZE}px`;
    dropIndicator.style.transform = `translate(${globalX}px, ${globalY}px)`;
  }

  function resetDragImage() {
    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';
    dropIndicator.style.display = 'none';
  }

  function setDragImage(event: MouseEvent, item: InventoryItem) {
    dragImg.style.backgroundImage = `url(${item.icon})`;
    dragImg.style.display = 'block';
    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;
    dragImg.style.width = `${item.width * SLOT_SIZE}px`;
    dragImg.style.height = `${item.height * SLOT_SIZE}px`;
    dropIndicator.style.display = 'block';
    document.body.style.cursor = 'none';
  }

  function getInventoryById(inventoryId: string) {
    if (inventoryId === 'player') return inventory;

    return openInventories.find((openInventory) => openInventory.inventory.inventoryId === inventoryId)!.inventory;
  }

  function onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (isDragging || !target?.dataset.slot) return;

    const parent = target.parentNode!.parentNode as HTMLElement;

    if (!parent.dataset.inventoryid) return;

    const sourceInventory = getInventoryById(parent.dataset.inventoryid as string);

    if (event.button === 0) {
      const slot = +target?.dataset.slot;
      const item = slot !== null && sourceInventory.getItemInSlot(slot);

      if (!item) return;

      isDragging = true;
      dragSlot = slot;
      dragItem = item;

      setDragImage(event, item);
      updateDropIndicatorPosition(event, item);
    } else if (event.button === 2) {
      // todo: context menu
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging || dragSlot === null) return;

    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;

    if (!dragItem) return;

    updateDropIndicatorPosition(event, dragItem);
  }

  async function onStopDrag(event: MouseEvent) {
    if (!isDragging || event.button !== 0) return;

    resetDragImage();

    const target = event.target as HTMLElement;
    const parent = target.parentNode! as HTMLElement;

    const targetInventoryId = parent.dataset.inventoryid as string;
    const inventory = getInventoryById(targetInventoryId);

    const item = inventory.getItemInSlot(dragSlot as number);
    const element: HTMLElement | null =
      item &&
      (document.elementFromPoint(
        event.clientX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
        event.clientY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2
      ) as HTMLElement | null);

    const slot = element?.dataset.slot ? +element.dataset.slot : null;

    if (slot !== null && slot !== dragSlot) {
      const quantity = Math.max(
        1,
        Math.min(item.quantity, isHoldingShift ? Math.floor(item.quantity / 2) : item.quantity)
      );
      const success = await fetchNui(
        'moveItem',
        {
          fromType: inventory.type,
          toType: inventory.type,
          fromId: inventory.inventoryId,
          toId: inventory.inventoryId,
          fromSlot: item.anchorSlot,
          toSlot: slot,
          quantity,
        },
        {
          data: true,
        }
      );

      if (success) {
        const result = quantity !== item.quantity ? item.split(inventory, quantity, slot) : item.move(inventory, slot);

        if (isEnvBrowser() && typeof result === 'object') items[result.uniqueId] = result;

        inventory.refreshSlots();
      }
    }

    isDragging = false;
    dragSlot = null;
    dragItem = null;
    document.body.style.cursor = 'auto';
  }

  function onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
      case 'Tab':
        return fetchNui(`closeInventory`);
      case 'Shift':
        return (isHoldingShift = true);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'Shift':
        return (isHoldingShift = false);
    }
  }

  const preventDefault = (event: KeyboardEvent | MouseEvent) => event.preventDefault();
</script>

<svelte:window
  onmousemove={onMouseMove}
  onmouseup={onStopDrag}
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
  oncontextmenu={preventDefault}
  ondragstart={preventDefault}
/>

<div class="absolute bg-green-500 opacity-30 pointer-events-none z-[51]" bind:this={dropIndicator}></div>
<DragPreview bind:dragImg />
<PlayerInventory {visible} {isDragging} {itemState} {inventory} {dragSlot} {onMouseDown} />

{#each openInventories as openInventory}
  <InventoryWindow
    visible
    {isDragging}
    {dragSlot}
    inventory={openInventory.inventory}
    itemState={openInventory.inventory.itemState}
    {onMouseDown}
  />
{/each}
