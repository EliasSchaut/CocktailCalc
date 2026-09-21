<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Icon from '$lib/icons/Icon.svelte';
  import { XCircle } from '$lib/icons';

  let { class: cls = '', ...rest }: HTMLButtonAttributes = $props();
</script>

<button
  class="rounded-md p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800 {cls}"
  {...rest}
>
  <Icon
    icon={XCircle}
    class="h-6 w-6 text-secondary-400 dark:text-secondary-600"
  />
</button>
