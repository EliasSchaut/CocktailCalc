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
    onrename,
  }: {
    name: string;
    price: number;
    alcohol: boolean;
    onupdatePrice: (name: string, price: number) => void;
    onupdateAlcohol: (name: string, alcohol: boolean) => void;
    ondelete: (name: string) => void;
    onrename: (name: string, newName: string) => Promise<void>;
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
    <CardTitle title={name} onrename={(n) => onrename(name, n)} />
    <form onsubmit={(e) => e.preventDefault()} bind:this={form} class="ml-auto">
      <PricePerLInput
        class="w-24 text-right"
        value={price.toFixed(2)}
        onchange={updatePrice}
      />
    </form>
    <button
      type="button"
      class="rounded-md p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800"
      onclick={toggleAlcohol}
      title="Enthält Alkohol?"
    >
      <Icon
        icon={PercentBadge}
        class="h-6 w-6 {alcohol
          ? 'text-red-500 hover:text-red-600'
          : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}"
      />
    </button>
  </div>
</Card>
