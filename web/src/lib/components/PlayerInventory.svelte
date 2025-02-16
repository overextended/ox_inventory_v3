<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';
  import type { InventoryState } from '$lib/state/inventory';

  interface Props {
    visible: boolean;
    isDragging: boolean;
    dragSlot: number | null;
    dropIndicator: HTMLElement;
    inventory: InventoryState;
    itemState: InventoryState['itemState'];
    onMouseDown: (event: MouseEvent) => void;
  }

  let {
    inventory,
    visible,
    itemState,
    dropIndicator = $bindable(),
    isDragging,
    dragSlot,
    onMouseDown,
  }: Props = $props();
</script>

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
                'w-full h-full bg-no-repeat bg-[length:75%] bg-center absolute top-0 left-0 z-50 bg-black/50 text-right text-xs px-1 flex',
                isDragging && 'pointer-events-none',
                dragSlot === item.anchorSlot && 'opacity-50'
              )}
              style={`background-image: url('${item.icon}');width: ${SLOT_SIZE * item.width - 1}px;height: ${SLOT_SIZE * item.height - SLOT_GAP}px;')`}
            >
              <div
                class="h-full w-full flex flex-col justify-between font-semibold text-foreground pointer-events-none"
              >
                <p class="text-[0.65rem]">{item.label}</p>
                <p>{item.quantity}</p>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
