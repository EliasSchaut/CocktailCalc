<script lang="ts">
  import type { Snippet } from 'svelte';
  import MinusSmallButton from './button/MinusSmallButton.svelte';

  let {
    hideButtonMinus = false,
    hasAlcohol = false,
    ondelete,
    children,
  }: {
    hideButtonMinus?: boolean;
    hasAlcohol?: boolean;
    ondelete?: () => void;
    children: Snippet;
  } = $props();

  function deleteItem() {
    if (!confirm('Item wirklich löschen?')) return;
    ondelete?.();
  }
</script>

<div
  class={[
    'relative overflow-hidden rounded-lg shadow-sm outline-solid',
    hasAlcohol
      ? 'outline-red-200 dark:outline-red-700'
      : 'outline-secondary-200 dark:outline-secondary-700',
  ]}
>
  {#if !hideButtonMinus}
    <MinusSmallButton class="absolute" title="Löschen" onclick={deleteItem} />
  {/if}
  <div class="h-full px-8 py-5 sm:p-6">
    {@render children()}
  </div>
</div>
