<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let { class: cls = '', children, ...rest }: HTMLButtonAttributes = $props();
</script>

<button
  class="rounded-md bg-primary-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 {cls}"
  {...rest}
>
  {@render children?.()}
</button>
