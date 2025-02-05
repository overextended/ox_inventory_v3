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

  class InventoryState extends BaseInventory {
    itemState = $state(this.items);
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
            category: 'miscellaneous',
          }
        : await fetchNui(`getStateKeyValue`, [`global`, `Item:${name}`]);
      Item = ItemFactory(name, data);
    }

    return new Item(metadata);
  }

  let inventory = new InventoryState({
    inventoryId: 'player',
    label: '',
    items: {},
    width: 2,
    height: 2,
  });

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
              1: 3,
              4: 8,
            },
            width: 12,
            height: 6,
          },
          items: [
            {
              name: 'ammo_9',
              quantity: 1,
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

  let inventoryItems = $state();

  let getInventoryItemAtSlot = (slot: number) => {
    const item = items[inventory.itemState[slot]];

    return item;
  };

  function refreshSlots() {
    inventoryItems = Array.from({ length: inventory.width * inventory.height }).map((_, index) =>
      getInventoryItemAtSlot(index)
    );
  }

  useNuiEvent('openInventory', async (data: { inventory: BaseInventory; items: InventoryItem[] }) => {
    inventory = new InventoryState(data.inventory);

    for (const value of data.items) {
      const item: InventoryItem = (await GetInventoryItem(value)) ?? (await CreateItem(value.name, value));
      items[item.anchorSlot] = item;

      item.move(inventory, item.anchorSlot);
    }

    inventory.itemState = items;

    console.log(JSON.stringify(inventory, '', 2));
    console.log(JSON.stringify(items, '', 2));
    refreshSlots();

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

  function onMouseDown(event: MouseEvent) {
    isDragging = true;
    let target = event.currentTarget as HTMLElement;
    const slot = +target.dataset.slot!;

    if (slot === null) return;
    const item = getInventoryItemAtSlot(slot);

    if (!item) return;

    dragSlot = slot;

    dragImg.style.backgroundImage = `url(${item.icon})`;
    dragImg.style.display = 'block';
    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;
    dragImg.style.width = `${item.width * SLOT_SIZE}px`;
    dragImg.style.height = `${item.height * SLOT_SIZE}px`;

    dropIndicator.style.width = `${item.width * SLOT_SIZE}px`;
    dropIndicator.style.height = `${item.height * SLOT_SIZE}px`;
    dropIndicator.style.display = 'block';

    document.body.style.cursor = 'none';
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging || dragSlot === null) return;

    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;

    const item = getInventoryItemAtSlot(dragSlot);

    if (!item) return;

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

  function onStopDrag(event: MouseEvent) {
    if (dragSlot === null) return;

    isDragging = false;
    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';
    dropIndicator.style.display = 'none';

    const item = getInventoryItemAtSlot(dragSlot);

    if (!item) return;

    const elm = document.elementFromPoint(
      event.clientX - (item.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2,
      event.clientY - (item.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2
    ) as HTMLElement;

    const slot: number | null = +elm.dataset.slot!;

    if (slot === null || slot === dragSlot) return;

    item.move(inventory, slot);
    inventory.itemState = inventory.items;
    refreshSlots();

    fetchNui('moveItem', {
      item,
      slot,
    });

    dragSlot = null;
    document.body.style.cursor = 'auto';
  }

  function cancelDrag() {
    isDragging = false;

    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';

    dragSlot = null;

    document.body.style.cursor = 'auto';
  }
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={cancelDrag} />

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

      {#each inventoryItems as item, index (item ? `${item.anchorSlot}-${index}` : `empty-${index}`)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={'bg-gradient-to-b from-black/20 to-black/50 flex text-primary-foreground items-center justify-center relative border-r border-b border-white/10'}
          style={`width: ${SLOT_SIZE}px;height: ${SLOT_SIZE}px;`}
          data-slot={index}
          onmousedown={onMouseDown}
          onmouseup={onStopDrag}
        >
          {#if item && item.anchorSlot === index}
            <span
              data-slot={index}
              data-anchorSlot={item.anchorSlot === index}
              class={cn(
                'w-full h-full bg-no-repeat bg-contain bg-center absolute top-0 left-0 z-50 bg-black/50',
                isDragging && 'pointer-events-none',
                dragSlot === item.anchorSlot && 'opacity-50'
              )}
              style={`background-image: url('${item.icon}');width: ${SLOT_SIZE * item.width - 1}px;height: ${SLOT_SIZE * item.height - SLOT_GAP}px;')`}
            >
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
