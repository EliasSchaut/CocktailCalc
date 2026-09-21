<script lang="ts">
  let { options, name }: { options: string[]; name: string } = $props();
</script>

<select
  {name}
  class="block w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-base text-secondary-800 shadow-xs focus:border-secondary-500 focus:ring-secondary-500 focus:outline-hidden sm:text-sm dark:border-secondary-800 dark:bg-secondary-800 dark:text-secondary-200"
>
  {#each options as option (option)}
    <option value={option} title={option} class="truncate whitespace-nowrap"
      >{option}</option
    >
  {/each}
</select>
