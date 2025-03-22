<script lang="ts">
import { draggableWindow } from '$lib/actions/draggableWindow';
import { itemTooltip } from '$lib/actions/itemTooltip';
import { openContextMenu } from '$lib/actions/openContextMenu';
import DurabilityCircle from '$lib/components/DurabilityCircle.svelte';
import ItemImage from '$lib/components/ItemImage.svelte';
import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';
import type { DragItemType, InventoryState } from '$lib/state/inventory';
import { cn } from '$lib/utils.js';
import { fetchNui } from '$lib/utils/fetchNui';
import { GetItemData } from '@common/item';
import Icon from '@iconify/svelte';

interface Props {
  visible: boolean;
  isDragging: boolean;
  dragItem: DragItemType | null;
  inventory: InventoryState;
  itemState: InventoryState['itemState'];
  onMouseDown: (event: MouseEvent) => void;
  inventoryCount: number;
  playerId: number;
}

const { inventory, visible, itemState, isDragging, dragItem, onMouseDown, inventoryCount, playerId }: Props = $props();
</script>

<div class={cn("absolute top-1/4 left-1/4 z-[50]", !visible && "hidden")} id={`inventory-${inventory.inventoryId}`}>
  <div class="flex flex-col">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="w-full bg-background p-2 text-foreground hover:cursor-move flex items-center justify-between" use:draggableWindow={{ inventory }}>
      <p>
        {inventory.label}

        {#if inventory.playerId}({inventory.playerId === playerId ? "you" : inventory.playerId}){/if}
      </p>
      {#if inventory.playerId !== playerId}
        <button
          type="button"
          class="cursor-pointer flex items-center justify-center text-xl text-destructive"
          onclick={() =>
              fetchNui(`closeInventory`, { inventoryId: inventory.inventoryId, inventoryCount: inventoryCount })}
        >
          <Icon icon="material-symbols:close" width={24} height={24} />
        </button>
      {/if}
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
          class={"bg-gradient-to-b from-black/20 to-black/50 flex text-primary-foreground items-center justify-center relative border-r border-b border-white/10"}
          style={`width: ${SLOT_SIZE}px;height: ${SLOT_SIZE}px;`}
          data-slot={index}
          onmousedown={onMouseDown}
        >
          {#if item && item.anchorSlot === index}
            {@const w = item.width}
            {@const h = item.height}
            <div
              data-slot={index}
              data-anchorSlot={item.anchorSlot === index}
              use:openContextMenu={{ itemId: item.uniqueId }}
              use:itemTooltip={{item}}
              class={cn(
                "absolute top-0 left-0 z-50 bg-black/50 text-right text-xs px-1 flex",
                isDragging && "pointer-events-none",
                dragItem?.uniqueId === item.uniqueId && "opacity-80 brightness-50 grayscale-[0.8]",
              )}
              style={`
                width: ${SLOT_SIZE * w - 1}px;
                height:  ${SLOT_SIZE * h - SLOT_GAP}px;
              `}
            >
              <ItemImage width={w} height={h} icon={item.icon} rotate={item.rotate} />
              <div
                class="h-full w-full flex flex-col justify-between font-semibold text-foreground pointer-events-none z-[51]"
              >
                <p class="text-[0.65rem]">{item.label}</p>
                {#if item.ammoName}
                  <p class="flex items-end justify-end">
                    <img src={GetItemData(item.ammoName)?.properties?.icon} alt="" class="h-5" />{item.ammoCount}
                  </p>
                {:else}
                  <p>x{item.quantity}</p>
                {/if}

                {#if item.durability}
                  <DurabilityCircle durability={item.durability} />
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
