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

  debugData<{ inventory: Partial<BaseInventory> }>(
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
          // @ts-ignore
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
  let dragImg: HTMLElement = $state(null)!;
  let dropIndicator: HTMLElement = $state(null)!;

  function updateDropIndicatorPosition(event: MouseEvent, item: InventoryItem) {
    const invGrid = document.querySelector('#inv-grid')!;
    const bodyRect = invGrid.getBoundingClientRect();
    const mouseX = event.clientX - bodyRect.left;
    const mouseY = event.clientY - bodyRect.top;

    const adjustedX = mouseX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2;
    const adjustedY = mouseY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2;

    const slotX = Math.max(
      0,
      Math.min(Math.floor(adjustedX / SLOT_SIZE), Math.floor(bodyRect.width / SLOT_SIZE) - item.width)
    );

    const slotY = Math.max(
      0,
      Math.min(Math.floor(adjustedY / SLOT_SIZE), Math.floor(bodyRect.height / SLOT_SIZE) - item.height)
    );

    dropIndicator.style.width = `${item.width * SLOT_SIZE}px`;
    dropIndicator.style.height = `${item.height * SLOT_SIZE}px`;
    dropIndicator.style.transform = `translate(${slotX * SLOT_SIZE}px, ${slotY * SLOT_SIZE}px)`;
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

  function onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (isDragging || !target?.dataset.slot) return;

    if (event.button === 0) {
      const slot = +target?.dataset.slot;
      const item = slot !== null && inventory.getItemInSlot(slot);

      if (!item) return;

      isDragging = true;
      dragSlot = slot;

      setDragImage(event, item);
      updateDropIndicatorPosition(event, item);
    } else if (event.button === 2) {
      // todo: context menu
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging || dragSlot === null) return;

    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;

    const item = inventory.getItemInSlot(dragSlot);

    if (!item) return;

    updateDropIndicatorPosition(event, item);
  }

  async function onStopDrag({ clientX, clientY, button }: MouseEvent) {
    if (!isDragging || button !== 0) return;

    resetDragImage();

    const item = inventory.getItemInSlot(dragSlot as number);
    const element: HTMLElement | null =
      item &&
      (document.elementFromPoint(
        clientX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
        clientY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2
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

<DragPreview bind:dragImg />
<PlayerInventory {visible} {isDragging} {itemState} {inventory} {dragSlot} bind:dropIndicator {onMouseDown} />
