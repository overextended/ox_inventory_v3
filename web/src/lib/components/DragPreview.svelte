<script lang="ts">
  import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';
  import type { DragItemType } from '$lib/state/inventory';
  import ItemImage from '$lib/components/ItemImage.svelte';
  import { cn } from '$lib/utils';

  interface Props {
    dragImg: HTMLElement;
    dropIndicator: HTMLElement;
    dragItem: DragItemType | null;
  }

  let { dragImg = $bindable(), dropIndicator = $bindable(), dragItem }: Props = $props();
  let dragX = $state('');
  let dragY = $state('');
  let dragTransform = $derived(`translate(${dragX}px, ${dragY}px)`);
  let visible = $state(false);
  let left = $state(0);
  let top = $state(0);

  function updateDragIndicator(event: MouseEvent) {
    if (!dragItem) return;

    let target = event.target as HTMLElement;
    let parent = target.parentNode as HTMLElement;

    if (target.dataset.anchorslot) {
      target = parent;
      parent = target.parentNode as HTMLElement;
    }

    dragX = `${event.clientX - dragImg.clientWidth / 2}`;
    dragY = `${event.clientY - dragImg.clientHeight / 2}`;

    if (!parent?.dataset?.inventoryid) {
      visible = false;
      left = 0;
      top = 0;
      return;
    }

    const invRect = parent.getBoundingClientRect();
    const mouseX = event.clientX - invRect.left;
    const mouseY = event.clientY - invRect.top;
    const adjustedX = mouseX - (dragItem.width * SLOT_SIZE) / 2 + SLOT_SIZE / 2;
    const adjustedY = mouseY - (dragItem.height * SLOT_SIZE) / 2 + SLOT_SIZE / 2;

    const slotX = Math.max(
      0,
      Math.min(Math.floor(adjustedX / SLOT_SIZE), Math.floor(invRect.width / SLOT_SIZE) - dragItem.width)
    );

    const slotY = Math.max(
      0,
      Math.min(Math.floor(adjustedY / SLOT_SIZE), Math.floor(invRect.height / SLOT_SIZE) - dragItem.height)
    );

    left = invRect.left + slotX * SLOT_SIZE;
    top = invRect.top + slotY * SLOT_SIZE;
    visible = true;
  }

  window.addEventListener('mousemove', updateDragIndicator);

  window.addEventListener('mousedown', (event: MouseEvent) => {
    if (!dragItem) return;

    updateDragIndicator(event);
  });
</script>

{#if dragItem}
  <div
    class="absolute bg-green-500 opacity-30 pointer-events-none z-[51]"
    bind:this={dropIndicator}
    style={`
    width: ${dragItem.width * SLOT_SIZE}px;
    height: ${dragItem.height * SLOT_SIZE}px;
    left: ${left}px;
    top: ${top}px;
    visibility: ${visible ? 'block' : 'hidden'};
  `}
  ></div>

  <div
    bind:this={dragImg}
    class={cn('absolute pointer-events-none top-0 z-[51] left-0', dragItem && 'pointer-events-none')}
    style={`
      transform: ${dragTransform};
      width: ${SLOT_SIZE * dragItem.width - 1}px;
      height:  ${SLOT_SIZE * dragItem.height - SLOT_GAP}px;
    `}
  >
    <ItemImage width={dragItem.width} height={dragItem.height} icon={dragItem.icon} rotate={dragItem.rotate} />
  </div>
{/if}
