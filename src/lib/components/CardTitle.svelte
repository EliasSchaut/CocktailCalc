<script lang="ts">
  import { tick } from 'svelte';
  import { ApiError } from '$lib/api';

  let {
    title,
    suffix = '',
    onrename,
  }: {
    title: string;
    /** shown after the name, not editable (e.g. the price) */
    suffix?: string;
    /** when set, clicking the name allows renaming; should throw on failure */
    onrename?: (newName: string) => Promise<void>;
  } = $props();

  let editing = $state(false);
  let draft = $state('');
  let error = $state('');
  let input: HTMLInputElement | undefined = $state();

  async function startEdit() {
    if (!onrename) return;
    draft = title;
    error = '';
    editing = true;
    await tick();
    input?.select();
  }

  async function commit() {
    if (!editing) return;
    const newName = draft.trim();
    if (!newName || newName === title) {
      editing = false;
      return;
    }
    try {
      await onrename!(newName);
      editing = false;
    } catch (e) {
      error =
        e instanceof ApiError && e.status === 409
          ? 'Name existiert bereits'
          : 'Umbenennen fehlgeschlagen';
      input?.focus();
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      editing = false;
    }
  }
</script>

{#if editing}
  <form class="w-full" onsubmit={(e) => e.preventDefault()}>
    <input
      bind:this={input}
      bind:value={draft}
      {onkeydown}
      onblur={commit}
      maxlength="40"
      required
      aria-label="Neuer Name"
      class="w-full rounded-md border-0 bg-white px-2 py-0.5 text-center text-2xl font-semibold text-secondary-900 inset-ring inset-ring-primary-600 focus:outline-hidden dark:bg-secondary-900 dark:text-secondary-100 dark:inset-ring-primary-400"
    />
    {#if error}
      <p class="mt-1 text-center text-sm text-red-600">{error}</p>
    {/if}
  </form>
{:else}
  <h3
    class="max-w-full truncate text-2xl font-semibold whitespace-nowrap"
    title={`${title} ${suffix}`.trim()}
  >
    {#if onrename}
      <button
        type="button"
        class="cursor-text rounded-sm hover:bg-secondary-100 dark:hover:bg-secondary-800"
        title="Umbenennen"
        onclick={startEdit}
      >
        {title}
      </button>
    {:else}
      {title}
    {/if}
    {#if suffix}
      <span>{suffix}</span>
    {/if}
  </h3>
{/if}
