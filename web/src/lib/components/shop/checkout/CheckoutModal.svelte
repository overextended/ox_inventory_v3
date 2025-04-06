<script lang="ts">
import CardSelect from '$lib/components/shop/checkout/CardSelect.svelte';
import CheckoutPaymentMethod from '$lib/components/shop/checkout/CheckoutPaymentMethod.svelte';
import { Button } from '$lib/components/ui/button';
import { modal } from '$lib/state/modal.svelte.js';
import type { PaymentAccount } from '$lib/types';
import { fetchNui } from '$lib/utils/fetchNui';
import type { InventoryItem } from '@common/item';

let { total, checkoutItems } = modal.childrenProps as {
  total: number;
  checkoutItems: { buyCount: number; item: InventoryItem }[];
};

const DUMMY_ACCOUNTS: PaymentAccount[] = [
  {
    id: 'personal',
    balance: 112300,
    label: 'Personal',
  },
  {
    id: 'some-account',
    balance: 32859,
    label: 'Some Society Account',
  },
];

const CASH_BALANCE = 3200;

let paymentMethod = $state<'cash' | 'card' | ''>('');
let paymentCard = $state<string>('');
let selectedCard = $derived(DUMMY_ACCOUNTS.find((account) => account.id === paymentCard));
let checkoutDisabled = $state(false);

$effect(() => {
  if (!paymentMethod) {
    checkoutDisabled = true;
    return;
  }

  if (paymentMethod === 'card' && !selectedCard) {
    checkoutDisabled = true;
    return;
  }

  if (paymentMethod === 'card' && selectedCard && selectedCard?.balance <= total) {
    checkoutDisabled = true;
    return;
  }

  if (paymentMethod === 'cash' && CASH_BALANCE <= total) {
    checkoutDisabled = true;
    return;
  }

  checkoutDisabled = false;
  return;
});

function confirmPayment() {
  modal.close();
  fetchNui('purchaseItems', {
    paymentMethod,
    paymentCardId: selectedCard?.id,
    checkoutItems,
  });
}
</script>

<div class="flex flex-col gap-8 justify-between">
  <CheckoutPaymentMethod bind:paymentMethod={paymentMethod} cashBalance={CASH_BALANCE} />
  {#if paymentMethod === 'card'}
    <CardSelect {paymentMethod} bind:paymentCard={paymentCard} accounts={DUMMY_ACCOUNTS} selectedCard={selectedCard} />
  {/if}

  <div class="flex justify-end">
    <Button class="flex items-center gap-2" startIcon="lucide:check" onclick={confirmPayment} disabled={checkoutDisabled}>
      Confirm Payment
    </Button>
  </div>
</div>
