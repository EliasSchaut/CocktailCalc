<script lang="ts">
  import { call_recipe_rename, call_recipe_upsert } from '$lib/api';
  import CardRecipe from '$lib/components/CardRecipe.svelte';
  import MinusButton from '$lib/components/button/MinusButton.svelte';
  import PlusButton from '$lib/components/button/PlusButton.svelte';
  import ToggleButton from '$lib/components/button/ToggleButton.svelte';
  import Input from '$lib/components/form/Input.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import PageTitle from '$lib/components/layout/PageTitle.svelte';
  import Section from '$lib/components/layout/Section.svelte';
  import type { RecipeWithIngredients } from '$lib/types';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  let recipes: RecipeWithIngredients[] = $state(data.recipes);
  // re-sync when load data changes (e.g. after a data import calls invalidateAll)
  $effect(() => {
    recipes = data.recipes;
  });
  let addToggle: ToggleButton;

  const findRecipe = (name: string) => recipes.find((r) => r.name === name);

  async function addRecipe(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (new FormData(form).get('name') as string).trim();
    if (!name) return;
    const recipe = await call_recipe_upsert(name);
    if (!findRecipe(name)) recipes.push(recipe);
    addToggle.hide();
  }

  function updatePrice(name: string, price: number) {
    const recipe = findRecipe(name);
    if (recipe) recipe.price = price;
  }

  function updateAlcohol(name: string, alcohol: boolean) {
    const recipe = findRecipe(name);
    if (recipe) recipe.alcohol = alcohol;
  }

  async function renameRecipe(name: string, newName: string) {
    await call_recipe_rename(name, newName);
    const recipe = findRecipe(name);
    if (recipe) recipe.name = newName;
  }

  function reorderIngredients(name: string, order: string[]) {
    const recipe = findRecipe(name);
    if (!recipe) return;
    const pos = new Map(order.map((n, i) => [n, i]));
    recipe.ingredients = [...recipe.ingredients].sort(
      (a, b) => (pos.get(a.name) ?? Infinity) - (pos.get(b.name) ?? Infinity),
    );
  }

  function deleteRecipe(name: string) {
    recipes = recipes.filter((r) => r.name !== name);
  }

  function upsertRecipeIngredient(upsert: {
    recipe: string;
    ingredient: string;
    amount: number;
  }) {
    const recipe = findRecipe(upsert.recipe);
    if (!recipe) return;
    const ingredient = recipe.ingredients.find(
      (i) => i.name === upsert.ingredient,
    );
    if (ingredient) ingredient.amount = upsert.amount;
    else
      recipe.ingredients.push({
        name: upsert.ingredient,
        amount: upsert.amount,
      });
  }

  function deleteRecipeIngredient(del: { recipe: string; ingredient: string }) {
    const recipe = findRecipe(del.recipe);
    if (recipe)
      recipe.ingredients = recipe.ingredients.filter(
        (i) => i.name !== del.ingredient,
      );
  }
</script>

<Section>
  <PageTitle>Rezepte</PageTitle>
  <ToggleButton bind:this={addToggle} buttonText="Rezept hinzufügen">
    <form onsubmit={addRecipe} class="flex items-center space-x-2">
      <Input placeholder="Rezeptname" name="name" required />
      <PlusButton type="submit" title="Hinzufügen" />
      <MinusButton
        type="button"
        title="Abbrechen"
        onclick={() => addToggle.hide()}
      />
    </form>
  </ToggleButton>

  <Grid>
    {#each recipes as recipe (recipe.name)}
      <CardRecipe
        name={recipe.name}
        price={recipe.price}
        alcohol={recipe.alcohol}
        ingredients={recipe.ingredients}
        ingredientNames={data.ingredientNames}
        onupdatePrice={updatePrice}
        onupdateAlcohol={updateAlcohol}
        ondelete={deleteRecipe}
        onrename={renameRecipe}
        onreorder={reorderIngredients}
        onupsertIngredient={upsertRecipeIngredient}
        ondeleteIngredient={deleteRecipeIngredient}
      />
    {/each}
  </Grid>
</Section>
