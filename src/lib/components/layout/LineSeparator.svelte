<script lang="ts">
  let { title = '', class: cls = '' }: { title?: string; class?: string } =
    $props();
</script>

<div class="relative w-full {cls}">
  <div class="absolute inset-0 flex w-full items-center" aria-hidden="true">
    <div
      class="w-full border-t border-secondary-300 dark:border-secondary-700"
    ></div>
  </div>
  {#if title !== ''}
    <div class="relative flex justify-center text-sm leading-6 font-medium">
      <span
        class="bg-white px-6 text-secondary-900 dark:bg-secondary-900 dark:text-secondary-100"
      >
        {title}
      </span>
    </div>
  {/if}
</div>
