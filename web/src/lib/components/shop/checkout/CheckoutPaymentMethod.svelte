<script>
import { Label } from '$lib/components/ui/label/index.js';
import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group/index.js';
import { cn } from '$lib/utils.js';
import { formatNumber } from '$lib/utils/number.js';
import Icon from '@iconify/svelte';

let { paymentMethod = $bindable(), cashBalance } = $props();
</script>

<div class="flex flex-col gap-1">
  <RadioGroup bind:value={paymentMethod} onValueChange={value => (paymentMethod = value)} class="grid grid-cols-2 gap-4">
    <div>
      <RadioGroupItem value="cash" id="cash" class="peer sr-only" />
      <Label
        for="cash"
        class={cn(
                "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                "cursor-pointer transition-all",
              )}
      >
        <Icon icon="lucide:banknote" class="mb-3 h-6 w-6" />
        <span class="font-medium">Cash</span>
      </Label>
    </div>
    <div>
      <RadioGroupItem value="card" id="card" class="peer sr-only" />
      <Label
        for="card"
        class={cn(
              "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
              "cursor-pointer transition-all",
            )}
      >
        <Icon icon="lucide:credit-card" class="mb-3 h-6 w-6" />
        <span class="font-medium">Card</span>
      </Label>
    </div>
  </RadioGroup>
  <p class="text-sm text-muted-foreground">
    Cash balance: {formatNumber(cashBalance)}
  </p>
</div>
