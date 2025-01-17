<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { cn } from '$lib/utils';
  import { BaseInventory } from '~/src/common/inventory/class';

  let visible = $state(isEnvBrowser())

  let inventory = new BaseInventory(null);
  inventory.width = 12
  inventory.height = 12

  let slots = inventory.width * inventory.height;

  if (isEnvBrowser()) {
    const root = document.getElementById('app');

    // https://i.imgur.com/iPTAdYV.png - Night time img
    root!.style.backgroundImage = 'url("https://i.imgur.com/3pzRj9n.png")';
    root!.style.backgroundSize = 'cover';
    root!.style.backgroundRepeat = 'no-repeat';
    root!.style.backgroundPosition = 'center';
  }

</script>

<div class={cn('flex items-center h-full justify-center', !visible && 'hidden')}>
  <div class='flex flex-col'>
    <div class="w-full bg-black/70 p-2 text-primary-foreground">
      <p>Inventory</p>
    </div>
    <div class={"grid gap-[1px]"} style={`grid-template-rows:repeat(${inventory.height}, 1fr);grid-template-columns: repeat(${inventory.width}, 1fr);`}>
      {#each Array.from({length: slots}) as item, index}
        <div class={'bg-white/50 flex items-center justify-center p-4 h-12 w-12'}>
          {index}
        </div>
        {/each}
    </div>
  </div>
</div>
