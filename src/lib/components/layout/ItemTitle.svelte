<script lang="ts">
  let { title, class: cls = '' }: { title: string; class?: string } = $props();
</script>

<h4 class="w-full truncate text-lg font-medium whitespace-nowrap {cls}" {title}>
  {title}
</h4>
