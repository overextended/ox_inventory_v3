<script lang="ts">
import { Button } from '$lib/components/ui/button';
import { modal } from '$lib/state/modal.svelte';

let props = modal.childrenProps as { title: string };
</script>

<div class="flex flex-col gap-4 justify-between">
  <div>

  </div>
  <div class="flex justify-end">
    <Button class="flex items-center gap-2" startIcon="lucide:check" onclick={() => modal.close()}>
      Confirm
    </Button>
  </div>
</div>
