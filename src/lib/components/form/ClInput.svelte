<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Input from './Input.svelte';

  let { class: cls = '', ...rest }: HTMLInputAttributes = $props();
</script>

<div class="flex items-center gap-x-2">
  <Input class={cls} type="number" step="0.5" min={0} max={10000} {...rest} />
  <span class="font-semibold">cl</span>
</div>
