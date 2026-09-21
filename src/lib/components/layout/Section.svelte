<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<section class="space-y-4 p-6">
  {@render children()}
</section>
