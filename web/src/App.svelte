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

  let playerInventoryId = 'player'; // temp
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
            height: 8,
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
              durability: 34,
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
            height: 2,
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
      {
        action: 'openInventoryWindow',
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
              durability: 80,
            },
          ],
        },
      },
    ],
    1000
  );

  useNuiEvent('openInventory', async (data: { inventory: BaseInventory; items: InventoryItem[] }) => {
    playerInventoryId = data.inventory.inventoryId;
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

  useNuiEvent('closeInventory', () => {
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
  let dragItem = $state<InventoryItem | null>(null);
  let dragImg: HTMLElement = $state(null)!;
  let dropIndicator: HTMLElement = $state(null)!;
  let itemRotation: boolean | undefined = false;

  function getInventoryById(inventoryId: string) {
    if (inventoryId === playerInventoryId) return inventory;

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
      itemRotation = item.rotate;
    } else if (event.button === 2) {
      // todo: context menu
    }
  }

  function resetDragState() {
    if (!dragItem) return;

    dragItem.rotate = itemRotation;
    itemRotation = false;
    isDragging = false;
    dragSlot = null;
    dragItem = null;
    document.body.style.cursor = 'auto';
  }

  async function onStopDrag(event: MouseEvent) {
    if (!isDragging || !dragItem || event.button !== 0) return;

    const target = event.target as HTMLElement;
    const parent = target.parentNode! as HTMLElement;

    const targetInventoryId = parent?.dataset?.inventoryid as string;

    if (!targetInventoryId) {
      resetDragState();
      return;
    }

    const toInventory = getInventoryById(targetInventoryId);
    const fromInventory = getInventoryById(dragItem.inventoryId!);
    const item = fromInventory.getItemInSlot(dragSlot as number);

    if (!toInventory || !fromInventory || !item) return;

    const element: HTMLElement = document.elementFromPoint(
      event.clientX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
      event.clientY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2
    ) as HTMLElement;

    const slot = element?.dataset.slot ? +element.dataset.slot : null;

    if (slot !== null && slot !== dragSlot) {
      const quantity = Math.max(
        1,
        Math.min(item.quantity, isHoldingShift ? Math.floor(item.quantity / 2) : item.quantity)
      );

      const success = await fetchNui(
        'moveItem',
        {
          fromType: fromInventory.type,
          toType: toInventory.type,
          fromId: fromInventory.inventoryId,
          toId: toInventory.inventoryId,
          fromSlot: item.anchorSlot,
          toSlot: slot,
          quantity,
        },
        {
          data: true,
        }
      );

      if (success) {
        const result =
          quantity !== item.quantity ? item.split(toInventory, quantity, slot) : item.move(toInventory, slot);

        // Refreshes are handled differently in CEF.
        if (isEnvBrowser()) {
          if (typeof result === 'object') items[result.uniqueId] = result;

          fromInventory.refreshSlots();

          if (fromInventory !== toInventory) toInventory.refreshSlots();
        }
      }
    }

    resetDragState();
  }

  function onKeyDown(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'escape':
      case 'tab':
        return fetchNui(`closeInventory`);
      case 'shift':
        return (isHoldingShift = true);
      case 'r':
        // if (!dragItem || dragItem.width === dragItem.height) return;
        // return (dragItem.rotate = !dragItem.rotate);
        return;
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
  onmouseup={onStopDrag}
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
  oncontextmenu={preventDefault}
  ondragstart={preventDefault}
/>

<DragPreview bind:dragImg bind:dropIndicator {dragItem} />
<PlayerInventory {visible} {isDragging} {itemState} {inventory} {dragItem} {onMouseDown} />

{#each openInventories as openInventory}
  <InventoryWindow
    visible
    {isDragging}
    {dragItem}
    inventory={openInventory.inventory}
    itemState={openInventory.inventory.itemState}
    {onMouseDown}
  />
{/each}
