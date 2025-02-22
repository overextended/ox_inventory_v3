<script lang="ts">
  interface DurabilityCircleProps {
    durability?: number;
  }

  let { durability }: DurabilityCircleProps = $props();
</script>

<svg class="absolute bottom-1 left-1 w-5 h-5 -rotate-90" viewBox="0 0 36 36">
  <circle class="text-gray-400 opacity-20" stroke="currentColor" stroke-width="6" fill="none" r="12" cx="18" cy="18" />

  {#if durability && durability !== 0}
    <circle
      class="text-green-500"
      stroke="currentColor"
      stroke-width="6"
      stroke-dasharray={`${(durability / 100) * (2 * Math.PI * 12)}, ${2 * Math.PI * 12}`}
      fill="none"
      r="12"
      cx="18"
      cy="18"
      style={`stroke: hsl(${durability * 1.1}, 100%, 50%)`}
    />
  {/if}
</svg>
