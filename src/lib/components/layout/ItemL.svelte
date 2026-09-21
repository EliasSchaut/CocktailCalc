<script lang="ts">
  let { l, class: cls = '' }: { l: number; class?: string } = $props();
</script>

<div class="flex items-center gap-x-2 {cls}" title={String(l)}>
  <span class="font-medium">{l.toFixed(1)}</span>
  <span class="font-medium">L</span>
</div>
