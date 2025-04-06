<script lang="ts">
import { cn } from '$lib/utils.js';
// biome-ignore lint/style/useImportType: <explanation>
import { Select as SelectPrimitive } from 'bits-ui';

let { ref = $bindable(null), class: className, ...restProps }: SelectPrimitive.GroupHeadingProps = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	class={cn("px-2 py-1.5 text-sm font-semibold", className)}
	{...restProps}
/>
