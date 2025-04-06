<script lang="ts">
import { itemTooltip } from '$lib/actions/itemTooltip';
import CheckoutModal from '$lib/components/shop/CheckoutModal.svelte';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import type { InventoryState } from '$lib/state/inventory';
import { modal } from '$lib/state/modal.svelte';
import type { InventoryItem } from '@common/item';
import Icon from '@iconify/svelte';

interface Props {
  inventory: InventoryState;
  itemState: InventoryState['itemState'];
}

const { inventory, itemState }: Props = $props();

let checkoutItems = $state<{ buyCount: number; item: InventoryItem }[]>([]);
let total = $derived(
  checkoutItems.reduce((prevValue, currentValue) => prevValue + currentValue.item.price * currentValue.buyCount, 0),
);

function addItemToCheckout(item: InventoryItem) {
  if (checkoutItems.find((checkoutItem) => checkoutItem.item.uniqueId === item.uniqueId)) {
    return;
  }

  checkoutItems.push({
    buyCount: 1,
    item,
  });
}

function handleAmountChange(value: string, itemId: string) {
  value = value.replace(/\D/g, '');

  if (value === '') {
    value = '1';
  }

  if (/^0\d/.test(value)) {
    value = value.replace(/^0+/, '');
  }

  const itemIndex = checkoutItems.findIndex(({ item }) => item.uniqueId === itemId);
  checkoutItems[itemIndex].buyCount = +value;
}

function handleRemoveItem(itemId: string) {
  checkoutItems = checkoutItems.filter(({ item }) => item.uniqueId !== itemId);
}

function openCheckout() {
  modal.open({
    title: 'Checkout',
    description: 'Checkout the items in your cart',
    children: CheckoutModal,
    childrenProps: {
      title: 'PROP!!!',
    },
  });
}
</script>

<div class="absolute inset-0 flex items-center justify-center">
  <div class="flex items-baseline gap-8 justify-center xl:max-w-[1280px] 2xl:max-w-[1600px] w-full lg:h-[600px] 2xl:h-[800px] p-2">
    <div class="flex-1 flex flex-col h-full bg-background/90">
      <div
        class="w-full bg-background p-2 text-foreground flex items-center justify-between"
      >
        <div class='flex items-center gap-2'>
          <Icon icon="hugeicons:store-02" width="24" height="24" />
          <p class="line-clamp-1">{inventory.label}</p>
        </div>
      </div>
      <div class="h-full w-full grid grid-cols-8 auto-rows-[128px]">
        {#each $itemState as item, index (item ? `${item.anchorSlot}-${index}` : `empty-${index}`)}
          {#if item}
            <div
              onclick={() => addItemToCheckout(item)}
              use:itemTooltip={{ item }}
              class={'bg-gradient-to-b from-black/20 to-black/50 flex text-primary-foreground relative border-r border-b border-white/10 hover:from-black/10 hover:to-black/40 hover:cursor-pointer'}
            >
              <div class="absolute w-full h-full bg-no-repeat bg-center bg-contain scale-75"
                   style={`background-image: url('${item.icon}')`}
              ></div>
              <div class="flex flex-col justify-between text-sm w-full h-full items-end px-1 text-muted-foreground">
                <p>{item.label}</p>
                <p class="text-primary-foreground">${item.price}</p>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
    <div class="w-1/3 self-baseline h-full flex flex-col">
      <div
        class="w-full bg-background p-2 text-foreground flex items-center justify-between"
      >
        <div class='flex items-center gap-2'>
          <Icon icon="hugeicons:shopping-cart-02" width="24" height="24" />
          <p>Checkout</p>
        </div>
      </div>
      <div class="w-full flex flex-col justify-between bg-background/90 flex-1 p-2">
        <div class="flex-1 flex flex-col gap-2">
<!--          TODO: scroll-->
          {#each checkoutItems as {item, buyCount}, index}
            <div class="flex items-center h-[96px] justify-between p-2 bg-background/90">
              <div class="flex items-center gap-2">
                <img class="w-[60px]" alt={item.name} src={item.icon}/>
                <div class="flex flex-col">
                  <p>{item.label}</p>
                  <p class="text-sm text-primary-foreground">${item.price * +buyCount}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Input bind:value={checkoutItems[index].buyCount} class="w-[80px]" onchange={e => handleAmountChange(e.currentTarget.value, item.uniqueId)} />
                <div>
                  <button onclick={() => handleRemoveItem(item.uniqueId)} class="bg-destructive text-destructive-foreground h-9 w-9 flex items-center justify-center rounded hover:bg-destructive/90">
                    <Icon icon="hugeicons:delete-02" width="20" height="20" />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
        <div class="flex flex-col">
          <p>Total: <span class="text-primary-foreground">${total}</span></p>
<!--            TODO: Create button component-->
          <Button class="flex items-center gap-2" onclick={openCheckout}>
            <Icon icon="hugeicons:shopping-cart-check-out-02" width="20" height="20" />
            Checkout
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
