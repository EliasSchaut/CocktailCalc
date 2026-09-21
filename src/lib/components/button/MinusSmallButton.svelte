<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Icon from '$lib/icons/Icon.svelte';
  import { XCircleSmall } from '$lib/icons';

  let { class: cls = '', ...rest }: HTMLButtonAttributes = $props();
</script>

<button class={cls} {...rest}>
  <Icon
    icon={XCircleSmall}
    class="w-5 fill-secondary-400 dark:fill-secondary-600"
  />
</button>
