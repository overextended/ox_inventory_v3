<script lang="ts">
import type { ContextMenuButtonResponse } from '$lib/actions/openContextMenu';
import { contextMenu } from '$lib/state/context-menu.svelte.js';
import { fetchNui } from '$lib/utils/fetchNui';
import Icon from '@iconify/svelte';

interface ContextMenuButtonProps {
  buttonId: string;
  label: string;
  icon?: string;
  menu?: ContextMenuButtonResponse[];
}

const { icon, label, buttonId, menu }: ContextMenuButtonProps = $props();

let submenuVisible = $state(false);
let isMouseOverMenu = $state(false);
let parentRef: HTMLElement | null = $state(null);

function buttonClick(e: MouseEvent) {
  e.stopImmediatePropagation();

  fetchNui('contextMenuClick', { itemId: contextMenu.itemId, buttonId });

  contextMenu.close();
}

function onMouseEnterButton() {
  if (!menu) return;
  submenuVisible = true;
}

function onMouseLeaveButton() {
  if (!menu) return;

  if (isMouseOverMenu) {
    return;
  }

  submenuVisible = false;
}

function onMouseEnterMenu() {
  if (!menu) return;

  isMouseOverMenu = true;
}

function onMouseLeaveMenu() {
  if (!menu) return;

  isMouseOverMenu = false;
  submenuVisible = false;
}
</script>

<div class="relative" bind:this={parentRef}>
  <button
    class="p-2 w-full flex gap-2 text-sm items-center hover:bg-secondary"
    onclick={buttonClick}
    onmouseenter={onMouseEnterButton}
    onmouseleave={onMouseLeaveButton}
  >
    {#if icon}
      <Icon {icon} width="20" height="20" />
    {/if}
    {label}

    {#if menu}
      <div class="ml-4">
        <Icon icon="hugeicons:arrow-right-01" width="20" height="20" />
      </div>
    {/if}
  </button>
  {#if menu && submenuVisible}
    <div
      class="absolute -top-2 bg-background/90 p-2 min-w-[120px] w-fit shadow-lg flex-col gap-2 z-[54]"
      style={`left: ${parentRef.clientWidth}px`}
      onmouseenter={onMouseEnterMenu}
      onmouseleave={onMouseLeaveMenu}
    >
      {#each menu as menuBtn}
        <button
          class="p-2 flex gap-2 text-sm items-center hover:bg-secondary w-full whitespace-nowrap"
          onclick={buttonClick}
        >
          {#if menuBtn.icon}
            <Icon icon={menuBtn.icon} width="20" height="20" />
          {/if}
          {menuBtn.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
