<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import type { Snippet } from 'svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import Nav from '$lib/components/layout/Nav.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>CocktailCalc</title>
</svelte:head>

<ModeWatcher defaultMode="system" />

<div class="flex min-h-screen flex-col justify-between">
  <Nav />
  <main class="mb-auto">
    {@render children()}
  </main>
  <Footer />
</div>
