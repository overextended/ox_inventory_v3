<script lang="ts">
import { Label } from '$lib/components/ui/label';
import * as Select from '$lib/components/ui/select/index.js';
import type { PaymentAccount } from '$lib/types';
import { formatNumber } from '$lib/utils/number';

interface Props {
  paymentMethod: string;
  paymentCard: string;
  selectedCard?: PaymentAccount;
  accounts: PaymentAccount[];
}

let { paymentMethod, paymentCard = $bindable(), selectedCard, accounts }: Props = $props();
</script>

{#if paymentMethod === 'card'}
    <div>
      <Label for="card-picker">Select Card</Label>
      <Select.Root type="single" value={paymentCard} onValueChange={(value) => (paymentCard = value)}>
        <Select.Trigger id="card-picker">
          {#if selectedCard}
            {selectedCard?.label} ({formatNumber(selectedCard?.balance)})
          {:else}
            Select Card
          {/if}
        </Select.Trigger>
        <Select.Content>
          {#each accounts as account}
            <Select.Item value={account.id}>{account.label} ({formatNumber(account.balance)})</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/if}
