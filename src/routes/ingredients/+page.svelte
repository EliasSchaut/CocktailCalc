<script lang="ts">
  import { call_ingredient_upsert } from '$lib/api';
  import CardIngredient from '$lib/components/CardIngredient.svelte';
  import MinusButton from '$lib/components/button/MinusButton.svelte';
  import PlusButton from '$lib/components/button/PlusButton.svelte';
  import ToggleButton from '$lib/components/button/ToggleButton.svelte';
  import Input from '$lib/components/form/Input.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import PageTitle from '$lib/components/layout/PageTitle.svelte';
  import Section from '$lib/components/layout/Section.svelte';
  import type { Ingredient } from '$lib/types';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  let ingredients: Ingredient[] = $state(data.ingredients);
  let addToggle: ToggleButton;

  const findIngredient = (name: string) =>
    ingredients.find((i) => i.name === name);

  async function addIngredient(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (new FormData(form).get('name') as string).trim();
    if (!name) return;
    const existing = findIngredient(name);
    const price = existing?.price ?? 0;
    const alcohol = existing?.alcohol ?? false;
    await call_ingredient_upsert(name, price, alcohol);
    if (!existing) ingredients.push({ name, price, alcohol });
    addToggle.hide();
  }

  function updatePrice(name: string, price: number) {
    const ingredient = findIngredient(name);
    if (ingredient) ingredient.price = price;
  }

  function updateAlcohol(name: string, alcohol: boolean) {
    const ingredient = findIngredient(name);
    if (ingredient) ingredient.alcohol = alcohol;
  }

  function deleteIngredient(name: string) {
    ingredients = ingredients.filter((i) => i.name !== name);
  }
</script>

<Section>
  <PageTitle>Zutaten</PageTitle>
  <ToggleButton bind:this={addToggle} buttonText="Zutat hinzufügen">
    <form onsubmit={addIngredient} class="flex items-center space-x-2">
      <Input placeholder="Zutatname" name="name" required />
      <PlusButton type="submit" title="Hinzufügen" />
      <MinusButton
        type="button"
        title="Abbrechen"
        onclick={() => addToggle.hide()}
      />
    </form>
  </ToggleButton>

  <Grid>
    {#each ingredients as ingredient (ingredient.name)}
      <CardIngredient
        name={ingredient.name}
        price={ingredient.price}
        alcohol={ingredient.alcohol}
        onupdatePrice={updatePrice}
        onupdateAlcohol={updateAlcohol}
        ondelete={deleteIngredient}
      />
    {/each}
  </Grid>
</Section>
