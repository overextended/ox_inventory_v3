<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { cn } from '$lib/utils';

  let visible = $state(isEnvBrowser());

  const SLOT_SIZE = 48;
  const SLOT_GAP = 1;

  type SlotData = {
    name: string;
    image: string;
    width: number;
    height: number;
  };

  let inventory = $state<{ width: number; height: number; items: Record<number, SlotData | null> }>({
    width: 12,
    height: 12,
    items: {
      31: {
        name: 'Ammo-9',
        image: 'ammo-9.png',
        width: 1,
        height: 1,
      },

      36: {
        name: 'WEAPON_HEAVYPISTOL',
        image: 'WEAPON_HEAVYPISTOL.png',
        width: 2,
        height: 2,
      },
    },
  });

  let slots = inventory.width * inventory.height;

  if (isEnvBrowser()) {
    const root = document.getElementById('app');

    // https://i.imgur.com/iPTAdYV.png - Night time img
    root!.style.backgroundImage = 'url("https://i.imgur.com/3pzRj9n.png")';
    root!.style.backgroundSize = 'cover';
    root!.style.backgroundRepeat = 'no-repeat';
    root!.style.backgroundPosition = 'center';
  }

  let isDragging = $state(false);
  let dragItem = $state<number | null>(null);
  let dragImg: HTMLElement;

  function onMouseDown(event: MouseEvent) {
    isDragging = true;
    let target = event.currentTarget as HTMLElement;
    let slot = target.dataset.slot ? +target.dataset.slot : null;

    if (slot === null) return;

    const item = inventory.items[slot];

    if (!item) return;

    dragItem = slot;

    dragImg.style.backgroundImage = `url(${item.image})`;
    dragImg.style.display = 'block';
    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;
    dragImg.style.width = `${item.width * SLOT_SIZE}px`;
    dragImg.style.height = `${item.height * SLOT_SIZE}px`;
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging || !dragItem) return;

    dragImg.style.transform = `translate(${event.clientX - dragImg.clientWidth / 2}px, ${event.clientY - dragImg.clientHeight / 2}px)`;
  }

  function onStopDrag(event: MouseEvent) {
    isDragging = false;
    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';

    const target = event.currentTarget as HTMLElement;

    let slot = target.dataset.slot ? +target.dataset.slot : null;

    if (slot === null || !dragItem) return;

    const item = inventory.items[dragItem];

    if (!item) return;

    const elm = document.elementFromPoint(
      event.clientX - (item.width * SLOT_SIZE) / 2,
      event.clientY - (item.height * SLOT_SIZE) / 2
    ) as HTMLElement;

    slot = +elm.dataset.slot!;

    delete inventory.items[dragItem];
    dragItem = slot;
    inventory.items[slot] = item;

    dragItem = null;
  }

  function cancelDrag() {
    isDragging = false;
    dragImg.style.backgroundImage = '';
    dragImg.style.display = 'none';
    dragItem = null;
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
          {#if inventory.items[index]}
            <span
              class="w-full h-full bg-no-repeat bg-contain bg-center absolute top-0 left-0 z-50 bg-black/50"
              style={`background-image: url('${inventory.items[index].image}');width: ${SLOT_SIZE * inventory.items[index].width - 1}px;height: ${SLOT_SIZE * inventory.items[index].height - SLOT_GAP}px;')`}
            >
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
