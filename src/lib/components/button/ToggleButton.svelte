<script lang="ts">
  import type { Snippet } from 'svelte';
  import BigButton from './BigButton.svelte';

  let {
    buttonText = 'Click me',
    children,
  }: { buttonText?: string; children: Snippet } = $props();

  let toggled = $state(false);

  export function show() {
    toggled = true;
  }
  export function hide() {
    toggled = false;
  }
</script>

<div>
  {#if !toggled}
    <BigButton onclick={show}>{buttonText}</BigButton>
  {:else}
    {@render children()}
  {/if}
</div>
