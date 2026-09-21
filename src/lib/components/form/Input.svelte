<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  let { class: cls = '', ...rest }: HTMLInputAttributes = $props();
</script>

<input
  class="block rounded-md border-0 bg-white px-2 py-1.5 text-lg text-secondary-900 shadow-xs inset-ring inset-ring-secondary-300 placeholder:text-secondary-400 focus:inset-ring-2 focus:inset-ring-primary-600 sm:text-sm sm:leading-6 dark:bg-secondary-900 dark:text-secondary-100 dark:inset-ring-secondary-700 dark:placeholder:text-secondary-600 dark:focus:inset-ring-primary-400 {cls}"
  maxlength={40}
  {...rest}
/>
