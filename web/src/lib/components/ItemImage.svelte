<script lang="ts">
  import { cn } from '$lib/utils';
  import { SLOT_GAP, SLOT_SIZE } from '$lib/constants/inventory';

  interface ItemImageProps {
    icon?: string;
    rotate?: boolean;
    width: number;
    height: number;
    dragImg?: HTMLElement;
  }

  const { width, height, rotate, icon, dragImg = $bindable(), className }: ItemImageProps = $props();
</script>

<div
  class={cn(
    'w-full h-full absolute pointer-events-none top-0 left-0 bg-no-repeat bg-[length:75%] bg-center',
    rotate && 'origin-bottom'
  )}
  style={`
    background-image: url('${icon}');
    width: ${SLOT_SIZE * (rotate ? height : width) - 1}px;
    height: ${SLOT_SIZE * (rotate ? width : height) - SLOT_GAP}px;
    transform: rotate(${rotate ? '-90deg' : '0deg'}) ${rotate ? `translate(-${SLOT_SIZE / 2}px, -${SLOT_SIZE / 2}px)` : ''};
 `}
></div>
