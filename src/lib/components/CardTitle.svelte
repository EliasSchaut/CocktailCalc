<script lang="ts">
  let { title }: { title: string } = $props();
</script>

<h3 class="truncate text-2xl font-semibold whitespace-nowrap" {title}>
  {title}
</h3>
