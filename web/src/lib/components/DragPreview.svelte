<script lang="ts">
  interface Props {
    dragImg: HTMLElement;
  }

  let { dragImg = $bindable() }: Props = $props();
</script>

<div
  bind:this={dragImg}
  class="pointer-events-none fixed left-0 top-0 z-[51] bg-none bg-center bg-no-repeat bg-contain border-white/10 border"
></div>
