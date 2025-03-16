<script lang="ts">
import TooltipField from '$lib/components/tooltip/TooltipField.svelte';
import { tooltip } from '$lib/state/tooltip.svelte.js';
import { cn } from '$lib/utils';
</script>

<div
  class={cn("absolute w-full max-w-xs p-2 flex-col gap-4 top-0 left-0 bg-background/90 shadow-lg hidden z-[55] pointer-events-none", tooltip.visible && 'flex')}
  style={`top:${tooltip.y}px;left:${tooltip.x}px`}
>
  <div class="border-b border-border flex items-center justify-between pb-2">
    <p class="font-medium">{tooltip.item?.label}</p>
    <div class="p-1 bg-secondary text-secondary-foreground uppercase text-xs font-medium rounded">
      <p>{tooltip.item?.category}</p>
    </div>
  </div>
  <div class='flex flex-col gap-4'>
    {#if tooltip.item?.description}
      <!--  TODO: MARKDOWN  -->
      <p class="text-muted-foreground text-sm font-medium">{tooltip.item?.description}</p>
    {/if}

    <div class='flex flex-col gap-1'>
      <TooltipField label="Durability" value={tooltip.item?.durability} />
      <TooltipField label="Ingredients" value="Mustard, Ketchup"/>
      <TooltipField label="Plate" value="XYZ123XD"/>
    </div>
  </div>
</div>

