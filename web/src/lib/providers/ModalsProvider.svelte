<script lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
import { modal } from '$lib/state/modal.svelte';
import { cn } from '$lib/utils';

const SIZES = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

let { children } = $props();
</script>

{@render children()}
<Dialog open={modal.visible} onOpenChange={() => (modal.visible = false)}>
  <DialogContent
    class={cn(!modal.size && 'max-w-md', typeof modal.size === 'string' && SIZES[modal.size])}
  >
    <DialogHeader>
      <DialogTitle>{modal.title}</DialogTitle>
      {#if modal.description}
        <DialogDescription>
          {modal.description}
        </DialogDescription>
      {/if}
    </DialogHeader>
    {#if modal.children}
      <svelte:component this={modal.children}/>
    {/if}
  </DialogContent>
</Dialog>
