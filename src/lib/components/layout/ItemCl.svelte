<script lang="ts">
  let { cl, class: cls = '' }: { cl: number; class?: string } = $props();
</script>

<div class="flex items-center gap-x-2 {cls}" title={String(cl)}>
  <span>{cl}</span>
  <span class="font-semibold">cl</span>
</div>
