<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { cn } from '$lib/utils';
  import { type InventoryItem, ItemFactory, GetItemData, GetInventoryItem } from '@common/item';
  import { BaseInventory } from '@common/inventory/class';
  import Config from '@common/config';
  import { useNuiEvent } from '$lib/hooks/useNuiEvents';
  import { debugData } from '$lib/utils/debugData';
  import { fetchNui } from '$lib/utils/fetchNui';

  let visible = $state(false);
  let isHoldingShift = false;

  class InventoryState extends BaseInventory {
    itemState = $state(this.items);

    constructor(data: Partial<BaseInventory>) {
      super(data);

      this.items = data.items;
    }

    getItemAtSlot(slot: number) {
      return items[this.items[slot]];
    }

    refreshSlots() {
      this.itemState = Array.from({ length: inventory.width * inventory.height }).map((_, index) =>
        this.getItemAtSlot(index)
      );
    }
  }

  async function CreateItem(name: string, metadata: Partial<ItemProperties> = {}) {
    let Item = GetItemData(name);

    if (!Item) {
      const data = isEnvBrowser()
        ? {
            name,
            quantity: 1,
            inventoryId: 'player',
            width: 2,
            height: 2,
            category: name.includes('ammo_') ? 'ammo' : 'weapon',
          }
        : await fetchNui(`getStateKeyValue`, [`global`, `Item:${name}`]);
      Item = ItemFactory(name, data);
    }

    return new Item(metadata);
  }

  let inventory = $state(
    new InventoryState({
      inventoryId: 'player',
      label: '',
      items: {},
      width: 2,
      height: 2,
    })
  );

  const items = $state<Record<number, InventoryItem>>({});
  const SLOT_SIZE = Config.Inventory_SlotSize;
  const SLOT_GAP = 1;

  debugData<{ inventory: BaseInventory }>(
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

  useNuiEvent('openInventory', async (data: { inventory: BaseInventory; items: InventoryItem[] }) => {
    inventory = new InventoryState(data.inventory);

    for (const value of data.items) {
      const item: InventoryItem = (await GetInventoryItem(value)) ?? (await CreateItem(value.name, value));
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
  let dragImg: HTMLElement;
  let dropIndicator: HTMLElement;

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
    if (isDragging || !event.target.dataset.slot) return;

    if (event.button === 0) {
      const slot = +event.target.dataset.slot;
      const item = slot !== null && inventory.getItemAtSlot(slot);

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

    const item = inventory.getItemAtSlot(dragSlot);

    if (!item) return;

    updateDropIndicatorPosition(event, item);
  }

  async function onStopDrag({ clientX, clientY, button }: MouseEvent) {
    if (!isDragging || button !== 0) return;

    resetDragImage();

    const item = inventory.getItemAtSlot(dragSlot);
    const element: HTMLElement =
      item &&
      document.elementFromPoint(
        clientX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
        clientY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2
      );
    const slot = element.dataset.slot ? +element.dataset.slot : null;

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

        if (result) items[result.uniqueId] = result;

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

<div
  bind:this={dragImg}
  class="pointer-events-none fixed left-0 top-0 z-[51] bg-none bg-center bg-no-repeat bg-contain border-white/10 border"
></div>

<div class={cn('flex items-center h-full justify-center bg-black/80', !visible && 'hidden')}>
  <div class="flex flex-col">
    <div class="w-full bg-background p-2 text-foreground">
      <p>{inventory.label}</p>
    </div>
    <div
      id="inv-grid"
      class="grid border-t border-l border-white/10"
      style={`grid-template-rows:repeat(${inventory.height}, 1fr);grid-template-columns: repeat(${inventory.width}, 1fr);`}
    >
      <div class="fixed bg-green-500 opacity-30 pointer-events-none z-[51]" bind:this={dropIndicator}></div>

      {#each inventory.itemState as item, index (item ? `${item.anchorSlot}-${index}` : `empty-${index}`)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={'bg-gradient-to-b from-black/20 to-black/50 flex text-primary-foreground items-center justify-center relative border-r border-b border-white/10'}
          style={`width: ${SLOT_SIZE}px;height: ${SLOT_SIZE}px;`}
          data-slot={index}
          onmousedown={onMouseDown}
        >
          {#if item && item.anchorSlot === index}
            <span
              data-slot={index}
              data-anchorSlot={item.anchorSlot === index}
              class={cn(
                'w-full h-full bg-no-repeat bg-contain bg-center absolute top-0 left-0 z-50 bg-black/50 text-right text-sm px-1 ',
                isDragging && 'pointer-events-none',
                dragSlot === item.anchorSlot && 'opacity-50'
              )}
              style={`background-image: url('${item.icon}');width: ${SLOT_SIZE * item.width - 1}px;height: ${SLOT_SIZE * item.height - SLOT_GAP}px;')`}
              >{`${item.quantity}`}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
