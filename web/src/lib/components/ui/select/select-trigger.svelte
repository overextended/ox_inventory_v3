<script lang="ts">
import { cn } from '$lib/utils.js';
import Icon from '@iconify/svelte';
// biome-ignore lint/style/useImportType: <explanation>
import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';

let {
  ref = $bindable(null),
  class: className,
  children,
  ...restProps
}: WithoutChild<SelectPrimitive.TriggerProps> = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	class={cn(
		"border-input ring-offset-background data-[placeholder]:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<Icon icon="lucide:chevron-down" class="size-4 opacity-50" />
</SelectPrimitive.Trigger>
