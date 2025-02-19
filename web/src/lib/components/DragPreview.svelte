<script lang="ts">
  import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';
  import type { InventoryItem } from '@common/item';

  interface Props {
    dragImg: HTMLElement;
    dropIndicator: HTMLElement;
    dragItem: InventoryItem | null;
  }

  let { dragImg = $bindable(), dropIndicator = $bindable(), dragItem }: Props = $props();
  let dropTransform = $state(`translate(0, 0)`);
  let dragTransform = $state(`translate(0, 0)`);
  let visible = $state(false);

  function updateDragIndicator(event: MouseEvent) {
    if (!dragItem) return;

    let target = event.target as HTMLElement;
    let parent = target.parentNode as HTMLElement;

    if (target.dataset.anchorslot) {
      target = parent;
      parent = target.parentNode as HTMLElement;
    }

    const rotation = dragItem.rotate ? -90 : 0;
    const dragX = dragItem.rotate
      ? `-${event.clientY - dragImg.clientHeight / 2}`
      : `${event.clientX - dragImg.clientWidth / 2}`;
    const dragY = dragItem.rotate
      ? `${event.clientX - dragImg.clientWidth / 2}`
      : `${event.clientY - dragImg.clientHeight / 2}`;

    dragTransform = `rotate(${rotation}deg) translate(${dragX}px, ${dragY}px)`;

    if (!parent?.dataset?.inventoryid) {
      visible = false;
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

    const globalX = invRect.left + slotX * SLOT_SIZE;
    const globalY = invRect.top + slotY * SLOT_SIZE;

    dropTransform = `translate(${globalX}px, ${globalY}px)`;
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
    transform: ${dropTransform};
    visibility: ${visible ? 'block' : 'hidden'};
  `}
  ></div>
  <div
    bind:this={dragImg}
    class="pointer-events-none fixed left-0 top-0 z-[51] bg-none bg-center bg-no-repeat bg-contain item"
    style={`
      --icon: url('${dragItem.icon}');
      --transform: ${dragTransform};
      --width: ${SLOT_SIZE * (dragItem.rotate ? dragItem.height : dragItem.width) - 1}px;
      --height: ${SLOT_SIZE * (dragItem.rotate ? dragItem.width : dragItem.height) - SLOT_GAP}px;
      width: ${SLOT_SIZE * dragItem.width - 1}px;
      height: ${SLOT_SIZE * dragItem.height - SLOT_GAP}px;
    `}
  ></div>
{/if}
