<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { Bars2 } from '$lib/icons';

  /** Grip that enables dragging of the surrounding dnd item while pressed. */
  let { onpointerdown }: { onpointerdown: (e: PointerEvent) => void } =
    $props();
</script>

<button
  type="button"
  class="-ml-2 shrink-0 cursor-grab touch-none rounded-md p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 active:cursor-grabbing dark:text-secondary-600 dark:hover:bg-secondary-800 dark:hover:text-secondary-400"
  title="Verschieben"
  aria-label="Verschieben"
  {onpointerdown}
>
  <Icon icon={Bars2} class="h-5 w-5" />
</button>
