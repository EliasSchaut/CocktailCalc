<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import { ChevronDown, type IconDef } from '$lib/icons';

  export type DropdownItem = {
    icon: IconDef;
    label: string;
    callback: () => void;
  };

  let {
    items,
    class: cls = '',
    children,
  }: { items: DropdownItem[]; class?: string; children: Snippet } = $props();

  let open = $state(false);
  let root: HTMLDivElement;

  function onWindowClick(e: MouseEvent) {
    if (open && !root.contains(e.target as Node)) open = false;
  }

  function select(item: DropdownItem) {
    open = false;
    item.callback();
  }
</script>

<svelte:window
  onclick={onWindowClick}
  onkeydown={(e) => e.key === 'Escape' && (open = false)}
/>

<div bind:this={root} class="relative inline-block text-left {cls}">
  <button
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white/40 px-3 py-2 text-sm font-semibold text-primary-800 shadow-xs hover:bg-white/50 dark:bg-white/20 dark:hover:bg-white/30"
    onclick={() => (open = !open)}
  >
    {@render children()}
    <Icon icon={ChevronDown} class="-mr-1 h-5 w-5 text-primary-800" />
  </button>

  {#if open}
    <div
      role="menu"
      class="absolute right-0 z-10 mt-2 w-32 origin-top-right divide-y divide-zinc-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden dark:bg-zinc-800 dark:text-white dark:ring-zinc-600"
    >
      <div class="py-1">
        {#each items as item (item.label)}
          <button
            role="menuitem"
            type="button"
            class="group flex w-full items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            onclick={() => select(item)}
          >
            <Icon
              icon={item.icon}
              class="mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-500"
            />
            {item.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
