<script lang="ts">
  import { isEnvBrowser } from '$lib/utils/misc';
  import { cn } from '$lib/utils';

  let visible = $state(isEnvBrowser())

</script>

<div class={cn(!visible && 'hidden')}>
  123
</div>
