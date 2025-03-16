<script lang="ts">
const { label, value } = $props<{ label: string; value: string | number }>();
</script>

{#if value !== undefined}
  <div class="flex items-center gap-2">
    <div class="p-1 bg-secondary text-secondary-foreground uppercase text-xs font-medium rounded">
      <p>{label}</p>
    </div>
    <p class="text-sm">{value}</p>
  </div>
{/if}
