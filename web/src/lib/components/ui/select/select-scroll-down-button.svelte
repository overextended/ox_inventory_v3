<script lang="ts">
import { cn } from '$lib/utils.js';
import Icon from '@iconify/svelte';
// biome-ignore lint/style/useImportType: <explanation>
import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

let {
  ref = $bindable(null),
  class: className,
  ...restProps
}: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
	bind:ref
	class={cn("flex cursor-default items-center justify-center py-1", className)}
	{...restProps}
>
	<Icon icon="lucide:chevron-down" class="size-4" />
</SelectPrimitive.ScrollDownButton>
