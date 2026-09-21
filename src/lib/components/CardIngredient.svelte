<script lang="ts">
  import { call_ingredient_delete, call_ingredient_upsert } from '$lib/api';
  import Icon from '$lib/icons/Icon.svelte';
  import { PercentBadge } from '$lib/icons';
  import Card from './Card.svelte';
  import CardTitle from './CardTitle.svelte';
  import PricePerLInput from './form/PricePerLInput.svelte';

  let {
    name,
    price,
    alcohol,
    onupdatePrice,
    onupdateAlcohol,
    ondelete,
  }: {
    name: string;
    price: number;
    alcohol: boolean;
    onupdatePrice: (name: string, price: number) => void;
    onupdateAlcohol: (name: string, alcohol: boolean) => void;
    ondelete: (name: string) => void;
  } = $props();

  let form: HTMLFormElement;

  async function updatePrice(e: Event & { currentTarget: HTMLInputElement }) {
    if (!form.reportValidity()) return;
    const newPrice = parseFloat(e.currentTarget.value);
    if (isNaN(newPrice) || newPrice === price) return;
    await call_ingredient_upsert(name, newPrice, alcohol);
    onupdatePrice(name, newPrice);
  }

  async function deleteIngredient() {
    await call_ingredient_delete(name);
    ondelete(name);
  }

  async function toggleAlcohol() {
    const hasAlcohol = !alcohol;
    await call_ingredient_upsert(name, price, hasAlcohol);
    onupdateAlcohol(name, hasAlcohol);
  }
</script>

<Card ondelete={deleteIngredient} hasAlcohol={alcohol}>
  <div class="flex items-center justify-between gap-x-2">
    <CardTitle title={name} />
    <form onsubmit={(e) => e.preventDefault()} bind:this={form} class="ml-auto">
      <PricePerLInput
        class="w-24 text-right"
        value={price.toFixed(2)}
        onchange={updatePrice}
      />
    </form>
    <button type="button" onclick={toggleAlcohol} title="Enthält Alkohol?">
      <Icon
        icon={PercentBadge}
        class="h-6 w-6 {alcohol ? 'text-red-500' : 'text-secondary-500'}"
      />
    </button>
  </div>
</Card>
