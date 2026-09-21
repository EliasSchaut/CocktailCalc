<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    placeTop = false,
    hideClose = false,
    children,
  }: { placeTop?: boolean; hideClose?: boolean; children: Snippet } = $props();

  let dialog: HTMLDialogElement;

  export function show() {
    dialog.showModal();
  }
  export function hide() {
    dialog.close();
  }

  /** Close when clicking on the backdrop (outside of the panel). */
  function onBackdropClick(e: MouseEvent) {
    if (e.target === dialog) hide();
  }
</script>

<dialog
  bind:this={dialog}
  onclick={onBackdropClick}
  class="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-4 text-left break-words opacity-0 transition-opacity transition-discrete duration-200 backdrop:bg-gray-500/75 backdrop:transition-opacity backdrop:duration-200 open:opacity-100 sm:p-0 dark:backdrop:bg-gray-900/75 starting:open:opacity-0"
>
  <div
    class={[
      'flex min-h-full justify-center',
      placeTop ? 'items-start' : 'items-end sm:items-center',
    ]}
  >
    <div
      class="relative w-full transform rounded-lg bg-white px-4 pt-5 pb-4 text-left text-secondary-900 shadow-xl sm:my-8 sm:max-w-sm sm:p-6 dark:bg-gray-900 dark:text-white"
    >
      {@render children()}
      {#if !hideClose}
        <div class="mt-5 sm:mt-6">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 dark:bg-gray-800"
            onclick={hide}
          >
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
</dialog>
