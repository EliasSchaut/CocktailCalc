<script lang="ts">
  import type { IconDef } from './index';

  let { icon, class: cls = '' }: { icon: IconDef; class?: string } = $props();
</script>

{#if icon.solid}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={icon.viewBox}
    fill="currentColor"
    aria-hidden="true"
    class={cls}
  >
    <path fill-rule="evenodd" clip-rule="evenodd" d={icon.d} />
  </svg>
{:else}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={icon.viewBox}
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    aria-hidden="true"
    class={cls}
  >
    <path stroke-linecap="round" stroke-linejoin="round" d={icon.d} />
  </svg>
{/if}
