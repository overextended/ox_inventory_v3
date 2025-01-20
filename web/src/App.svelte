<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { cn } from '$lib/utils';
  import { type InventoryItem, ItemFactory } from '~/src/common/item';
  import { BaseInventory } from '~/src/common/inventory/class';

  let visible = $state(isEnvBrowser());

  class InventoryState extends BaseInventory {
    itemState = $state(this.items);
  }

  const SLOT_SIZE = 48;
  const SLOT_GAP = 1;

  const ammo9Item = ItemFactory('ammo-9', {
    label: 'ammo-9',
    name: 'ammo-9',
    icon: 'ammo-9.png',
  });

  const heavyPistolItem = ItemFactory('WEAPON_HEAVYPISTOL', {
    label: 'Heavy Pistol',
    name: 'WEAPON_HEAVYPISTOL',
    icon: 'WEAPON_HEAVYPISTOL.png',
    width: 2,
    height: 2,
    inventoryId: 'player',
  });

  const ammo = new ammo9Item();
  ammo.inventoryId = 'player';
  ammo.anchorSlot = 3;
  ammo.uniqueId = '123';

  const pistol = new heavyPistolItem();
  pistol.inventoryId = 'player';
  pistol.anchorSlot = 14;
  pistol.uniqueId = '1233';

  const items = $state<Record<string, InventoryItem>>({
    '123': ammo,
    '1233': pistol,
  });

  let inventory = new InventoryState({
    inventoryId: 'player',
    label: 'inventory',
    items: {
      3: '123',
      14: '1233',
      15: '1233',
      26: '1233',
      27: '1233',
    },
    width: 12,
    height: 12,
  });

  let slots = inventory.width * inventory.height;
  let inventoryItems = $derived(Array.from({ length: slots }).map((_, index) => getInventoryItemAtSlot(index)));

  const getInventoryItemAtSlot = (slot: number) => items[inventory.itemState[slot]];

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
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging || dragSlot === null) return;

    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;
  }

  function onStopDrag(event: MouseEvent) {
    if (dragSlot === null) return;

    isDragging = false;
    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';

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

    dragSlot = null;
  }

  function cancelDrag() {
    isDragging = false;
    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';
    dragSlot = null;
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
      <p>Inventory</p>
    </div>
    <div
      class="grid border-t border-l border-white/10"
      style={`grid-template-rows:repeat(${inventory.height}, 1fr);grid-template-columns: repeat(${inventory.width}, 1fr);`}
    >
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
                isDragging && 'pointer-events-none'
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
