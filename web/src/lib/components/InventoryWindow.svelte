<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';
  import type { InventoryState } from '$lib/state/inventory';
  import type { InventoryItem } from '~/src/common/item';

  interface Props {
    visible: boolean;
    isDragging: boolean;
    dragItem: InventoryItem | null;
    inventory: InventoryState;
    itemState: InventoryState['itemState'];
    onMouseDown: (event: MouseEvent) => void;
  }

  let { inventory, visible, itemState, isDragging, dragItem, onMouseDown }: Props = $props();

  function draggableWindow(node: HTMLElement) {
    let moving = false;
    let left =
      inventory.type === 'player'
        ? window.innerWidth / 2 - (SLOT_SIZE * inventory.width + SLOT_GAP) / 2
        : window.innerWidth / 16;
    let top =
      inventory.type === 'player'
        ? window.innerHeight / 2 - (SLOT_SIZE * inventory.height + SLOT_GAP) / 2
        : window.innerHeight / 16;

    const container = document.getElementById(`inventory-${inventory.inventoryId}`) as HTMLElement;

    while (true) {
      const element = document.elementFromPoint(left, top) as HTMLElement;

      if (!element || element.id === 'app' || element.dataset.slot) break;

      const rect = element.getBoundingClientRect();

      left = rect.right + 2;
      top = rect.top;
    }

    container.style.position = 'absolute';
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    container.style.userSelect = 'none';

    node.addEventListener('mousedown', () => {
      moving = true;
    });

    window.addEventListener('mousemove', (e) => {
      if (moving) {
        left += e.movementX;
        top += e.movementY;
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
      }
    });

    window.addEventListener('mouseup', () => {
      moving = false;
    });
  }
</script>

<div class={cn('absolute top-1/4 left-1/4 z-[50]', !visible && 'hidden')} id={`inventory-${inventory.inventoryId}`}>
  <div class="flex flex-col">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full bg-background p-2 text-foreground hover:cursor-move" use:draggableWindow>
      <p>{inventory.label}</p>
    </div>
    <div
      id="inv-grid"
      class="grid border-t border-l border-white/10"
      style={`grid-template-rows:repeat(${inventory.height}, 1fr);grid-template-columns: repeat(${inventory.width}, 1fr);`}
      data-inventoryid={inventory.inventoryId}
    >
      {#each $itemState as item, index (item ? `${item.anchorSlot}-${index}` : `empty-${index}`)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={'bg-gradient-to-b from-black/20 to-black/50 flex text-primary-foreground items-center justify-center relative border-r border-b border-white/10'}
          style={`width: ${SLOT_SIZE}px;height: ${SLOT_SIZE}px;`}
          data-slot={index}
          onmousedown={onMouseDown}
        >
          {#if item && item.anchorSlot === index}
            <div
              data-slot={index}
              data-anchorSlot={item.anchorSlot === index}
              class={cn(
                'w-full h-full bg-no-repeat bg-[length:75%] bg-center absolute top-0 left-0 z-50 bg-black/50 text-right text-xs px-1 flex item',
                isDragging && 'pointer-events-none',
                dragItem === item && 'opacity-50'
              )}
              style={`
                --icon: url('${item.icon}');
                --transform: rotate(${item.rotate ? '-90deg' : '0deg'}) ${item.rotate ? `translate(-${SLOT_SIZE / 2}px, -${SLOT_SIZE / 2}px)` : ''};
                --width: ${SLOT_SIZE * (item.rotate ? item.height : item.width) - 1}px;
                --height: ${SLOT_SIZE * (item.rotate ? item.width : item.height) - SLOT_GAP}px;
                width: ${SLOT_SIZE * item.width - 1}px;
                height: ${SLOT_SIZE * item.height - SLOT_GAP}px;
              `}
            >
              <div
                class="h-full w-full flex flex-col justify-between font-semibold text-foreground pointer-events-none"
              >
                <p class="text-[0.65rem]">{item.label}</p>
                <p>x{item.quantity}</p>

                {#if item.ammoName}
                  <!-- placeholder -->
                  <p class="absolute left-8 bottom-0">{item.ammoCount ?? 0} bullets</p>
                {/if}

                {#if item.durability}
                  <svg class="absolute bottom-1 left-1 w-6 h-6" viewBox="0 0 36 36">
                    <circle
                      class="text-gray-400 opacity-20"
                      stroke="currentColor"
                      stroke-width="6"
                      fill="none"
                      r="12"
                      cx="18"
                      cy="18"
                    />

                    {#if item.durabiility !== 0}
                      <circle
                        class="text-green-500"
                        stroke="currentColor"
                        stroke-width="6"
                        stroke-dasharray={`${(item.durability / 100) * (2 * Math.PI * 12)}, ${2 * Math.PI * 12}`}
                        stroke-linecap="round"
                        fill="none"
                        r="12"
                        cx="18"
                        cy="18"
                        style={`stroke: hsl(${item.durability * 1.1}, 100%, 50%);`}
                      />
                    {/if}
                  </svg>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
