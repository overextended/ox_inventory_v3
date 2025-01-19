<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { cn } from '$lib/utils';
  import type { InventoryItem } from '~/src/common/item';
  import { BaseInventory } from '~/src/common/inventory/class';

  let visible = $state(isEnvBrowser());

  const SLOT_SIZE = 48;
  const SLOT_GAP = 1;

  const items = $state<Record<string, InventoryItem>>({
    '123': {
      quantity: 3,
      itemLimit: 3,
      stackSize: 2,
      name: 'ammo-9',
      category: '',
      decay: false,
      rarity: 'rare',
      degrade: 1,
      uniqueId: '123',
      label: '9mm bullet',
      weight: 2,
      description: '',
      icon: 'ammo-9.png',
      tradeable: false,
      value: 300,
      width: 1,
      height: 1,
      anchorSlot: 3,
    },
    '1233': {
      quantity: 3,
      itemLimit: 3,
      stackSize: 2,
      name: 'WEAPON_HEAVYPISTOL',
      category: '',
      decay: false,
      rarity: 'rare',
      degrade: 1,
      uniqueId: '1233',
      label: 'Heavy Pistol',
      weight: 2,
      description: '',
      icon: 'WEAPON_HEAVYPISTOL.png',
      tradeable: false,
      value: 300,
      width: 2,
      height: 2,
      anchorSlot: 14,
    },
  });

  let inventory = $state(
    new BaseInventory({
      label: 'inventory',
      items: {
        3: '123',
        14: '1233',
      },
      width: 12,
      height: 12,
    })
  );

  $effect(() => console.log(inventory));

  let slots = inventory.width * inventory.height;

  const getInventoryItemAtSlot = (slot: number) => items[inventory.items[slot]];

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
      event.clientX - (item.width * SLOT_SIZE) / 2,
      event.clientY - (item.height * SLOT_SIZE) / 2
    ) as HTMLElement;

    const slot: number | null = +elm.dataset.slot!;

    if (slot === null || slot === dragSlot) return;

    inventory.moveItem(slot, item);
    inventory = new BaseInventory({ ...inventory, items: { ...inventory.items } });
    console.log(inventory.items);

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
      {#each Array.from({ length: slots }) as item, index}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={'bg-gradient-to-b from-black/20 to-black/50 flex text-primary-foreground items-center justify-center relative border-r border-b border-white/10'}
          style={`width: ${SLOT_SIZE}px;height: ${SLOT_SIZE}px;`}
          data-slot={index}
          onmousedown={onMouseDown}
          onmouseup={onStopDrag}
        >
          {#if getInventoryItemAtSlot(index)}
            <span
              data-slot={index}
              class="w-full h-full bg-no-repeat bg-contain bg-center absolute top-0 left-0 z-50 bg-black/50"
              style={`background-image: url('${index === getInventoryItemAtSlot(index).anchorSlot && getInventoryItemAtSlot(index).icon}');width: ${SLOT_SIZE * getInventoryItemAtSlot(index).width - 1}px;height: ${SLOT_SIZE * getInventoryItemAtSlot(index).height - SLOT_GAP}px;')`}
            >
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
