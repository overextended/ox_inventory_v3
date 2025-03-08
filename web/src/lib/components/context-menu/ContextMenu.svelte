<script lang="ts">
import { contextMenu } from '$lib/state/context-menu.svelte.js';
import { cn } from '$lib/utils';
import ContextMenuButton from '$lib/components/context-menu/ContextMenuButton.svelte';

function outsideClick(e: MouseEvent) {
  e.stopImmediatePropagation();

  contextMenu.close();
}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class={cn("absolute w-full h-full hidden z-[52]", contextMenu.visible && "block")} onclick={outsideClick}>
  <div
    class={cn(
      "bg-background p-2 min-w-[120px] shadow-lg flex-col gap-2 absolute hidden z-[53]",
      contextMenu.visible && "flex",
    )}
    style={`top: ${contextMenu.y}px; left: ${contextMenu.x}px`}
  >
    <ContextMenuButton buttonId="use" label="Use" icon="hugeicons:cursor-magic-selection-02" />
    <ContextMenuButton buttonId="give" label="Give" icon="hugeicons:safe-delivery-01" />
    {#each contextMenu.buttons as { label, icon, buttonId, menu }}
      <ContextMenuButton {label} {icon} {buttonId} {menu}/>
    {/each}
  </div>
</div>
