<script lang="ts">
import { cn } from '$lib/utils.js';
import Icon from '@iconify/svelte';
// biome-ignore lint/style/useImportType: <explanation>
import { RadioGroup as RadioGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

let {
  ref = $bindable(null),
  class: className,
  ...restProps
}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> & {
  value: string;
} = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	class={cn(
		"border-primary text-primary focus-visible:ring-ring aspect-square size-4 rounded-full border shadow focus:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div class="flex items-center justify-center">
			{#if checked}
				<Icon icon="lucide:circle" class="fill-primary size-3.5" />
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
