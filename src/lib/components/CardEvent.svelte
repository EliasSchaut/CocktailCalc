<script lang="ts">
  import {
    call_event_delete,
    call_event_delete_recipe,
    call_event_ingredient_list,
    call_event_upsert_recipe,
  } from '$lib/api';
  import Icon from '$lib/icons/Icon.svelte';
  import { Check, ClipboardDocument } from '$lib/icons';
  import { shoppingListMarkdown } from '$lib/shoppingList';
  import type { IngredientWithAmount, RecipeWithAmount } from '$lib/types';
  import Card from './Card.svelte';
  import CardTitle from './CardTitle.svelte';
  import SelectItems from './SelectItems.svelte';
  import MinusButton from './button/MinusButton.svelte';
  import PlusButton from './button/PlusButton.svelte';
  import AmountInput from './form/AmountInput.svelte';
  import ItemAmount from './layout/ItemAmount.svelte';
  import ItemL from './layout/ItemL.svelte';
  import ItemTitle from './layout/ItemTitle.svelte';
  import LineSeparator from './layout/LineSeparator.svelte';

  type UpsertRecipe = { event: string; recipe: string; amount: number };
  type DeleteRecipe = { event: string; recipe: string };

  let {
    name,
    price,
    recipes,
    recipeNames,
    alcoholicRecipes = [],
    onupdatePrice,
    ondelete,
    onupsertRecipe,
    ondeleteRecipe,
  }: {
    name: string;
    price: number;
    recipes: RecipeWithAmount[];
    /** names of all recipes, selectable to add to the event */
    recipeNames: string[];
    /** names of recipes containing alcohol, shown in red */
    alcoholicRecipes?: string[];
    onupdatePrice: (name: string, price: number) => void;
    ondelete: (name: string) => void;
    onupsertRecipe: (upsert: UpsertRecipe) => void;
    ondeleteRecipe: (del: DeleteRecipe) => void;
  } = $props();

  let ingredientList: IngredientWithAmount[] = $state([]);
  let copied = $state(false);
  const amountSum = $derived(recipes.reduce((acc, r) => acc + r.amount, 0));

  $effect(() => {
    updateIngredientList();
  });

  async function updateIngredientList() {
    ingredientList = (await call_event_ingredient_list(name)).ingredients;
  }

  async function copyShoppingList() {
    await navigator.clipboard.writeText(
      shoppingListMarkdown(name, price, ingredientList),
    );
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  async function deleteEvent() {
    await call_event_delete(name);
    ondelete(name);
  }

  async function addRecipe(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const recipe = data.get('recipe') as string | null;
    const amount = parseInt(data.get('amount') as string);
    if (!recipe || isNaN(amount)) return;
    form.reset(); // reset synchronously so new input is not wiped after the request
    await upsertRecipe(recipe, amount);
  }

  async function upsertRecipe(recipe: string, amount: number) {
    const upsert = { event: name, recipe, amount };
    const event = await call_event_upsert_recipe(upsert);
    onupsertRecipe(upsert);
    onupdatePrice(name, event.price);
    await updateIngredientList();
  }

  async function deleteRecipe(recipe: string) {
    const del = { event: name, recipe };
    const event = await call_event_delete_recipe(del);
    ondeleteRecipe(del);
    onupdatePrice(name, event.price);
    await updateIngredientList();
  }
</script>

<Card ondelete={deleteEvent}>
  <div class="flex h-full flex-col items-center justify-between gap-y-2">
    <CardTitle title="{name} ({price.toFixed(2)}€)" />
    <ul class="mt-2 flex w-full grow flex-col justify-between gap-y-1">
      {#each recipes as recipe (recipe.name)}
        <li>
          <form
            onsubmit={(e) => e.preventDefault()}
            class="flex items-center gap-x-3"
          >
            <ItemTitle
              title={recipe.name}
              class={alcoholicRecipes.includes(recipe.name)
                ? 'text-red-600 dark:text-red-400'
                : ''}
            />
            <AmountInput
              class="w-16"
              value={recipe.amount}
              name="amount"
              required
              onchange={(e) =>
                upsertRecipe(recipe.name, Number(e.currentTarget.value))}
            />
            <MinusButton
              type="button"
              class="ml-4"
              title="Rezept entfernen"
              onclick={() => deleteRecipe(recipe.name)}
            />
          </form>
        </li>
      {/each}
      {#if recipes.length > 0}
        <LineSeparator class="my-3" />
        <li class="-mb-3 flex items-center gap-x-3">
          <ItemTitle class="font-semibold" title="Summe" />
          <ItemAmount class="mr-10" amount={amountSum} />
        </li>
      {/if}
      <li class="mt-auto">
        <LineSeparator class="my-3" title="Rezept hinzufügen" />
        <form onsubmit={addRecipe} class="flex gap-x-3">
          <SelectItems options={recipeNames} name="recipe" />
          <AmountInput class="w-16" value="0" name="amount" required />
          <PlusButton class="ml-4" type="submit" title="Rezept hinzufügen" />
        </form>
        {#if recipes.length > 0}
          <div class="my-3 flex items-center gap-x-2">
            <LineSeparator title="Zutaten" />
            <button
              type="button"
              class="shrink-0 rounded-md p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              title={copied ? 'Kopiert' : 'Einkaufsliste als Markdown kopieren'}
              aria-label="Einkaufsliste als Markdown kopieren"
              onclick={copyShoppingList}
            >
              <Icon
                icon={copied ? Check : ClipboardDocument}
                class="h-5 w-5 {copied
                  ? 'text-green-600'
                  : 'text-secondary-500 dark:text-secondary-400'}"
              />
            </button>
          </div>
          <div class="flex flex-col gap-y-3">
            {#each ingredientList as ingredient (ingredient.name)}
              <div class="flex items-center justify-between">
                <ItemTitle title={ingredient.name} />
                <ItemL class="ml-auto text-right" l={ingredient.amount} />
              </div>
            {/each}
          </div>
        {/if}
      </li>
    </ul>
  </div>
</Card>
