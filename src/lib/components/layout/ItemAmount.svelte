<script lang="ts">
  let { amount, class: cls = '' }: { amount: number; class?: string } =
    $props();
</script>

<div class="flex items-center gap-x-2 {cls}" title={String(amount)}>
  <span>{amount}</span>
  <span class="font-semibold">#</span>
</div>
