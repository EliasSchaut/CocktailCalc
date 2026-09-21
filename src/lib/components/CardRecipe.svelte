<script lang="ts">
  import { flip } from 'svelte/animate';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import {
    call_recipe_delete,
    call_recipe_delete_ingredient,
    call_recipe_order_ingredients,
    call_recipe_upsert_ingredient,
  } from '$lib/api';
  import type { IngredientWithAmount } from '$lib/types';
  import Card from './Card.svelte';
  import CardTitle from './CardTitle.svelte';
  import DragHandle from './DragHandle.svelte';
  import SelectItems from './SelectItems.svelte';
  import MinusButton from './button/MinusButton.svelte';
  import PlusButton from './button/PlusButton.svelte';
  import ClInput from './form/ClInput.svelte';
  import ItemCl from './layout/ItemCl.svelte';
  import ItemTitle from './layout/ItemTitle.svelte';
  import LineSeparator from './layout/LineSeparator.svelte';

  type UpsertIngredient = {
    recipe: string;
    ingredient: string;
    amount: number;
  };
  type DeleteIngredient = { recipe: string; ingredient: string };
  type Item = IngredientWithAmount & { id: string };

  let {
    name,
    price,
    alcohol,
    ingredients,
    ingredientNames,
    onupdatePrice,
    onupdateAlcohol,
    ondelete,
    onrename,
    onupsertIngredient,
    ondeleteIngredient,
    onreorder,
  }: {
    name: string;
    price: number;
    alcohol: boolean;
    ingredients: IngredientWithAmount[];
    /** names of all ingredients, selectable to add to the recipe */
    ingredientNames: string[];
    onupdatePrice: (name: string, price: number) => void;
    onupdateAlcohol: (name: string, alcohol: boolean) => void;
    ondelete: (name: string) => void;
    onrename: (name: string, newName: string) => Promise<void>;
    onupsertIngredient: (upsert: UpsertIngredient) => void;
    ondeleteIngredient: (del: DeleteIngredient) => void;
    onreorder: (recipe: string, order: string[]) => void;
  } = $props();

  const clSum = $derived(ingredients.reduce((acc, i) => acc + i.amount, 0));

  // local copy for drag and drop, kept in sync with the prop
  let items: Item[] = $state([]);
  $effect(() => {
    items = ingredients.map((i) => ({ ...i, id: i.name }));
  });
  let dragDisabled = $state(true);

  function consider(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items;
  }

  async function finalize(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items;
    dragDisabled = true;
    const order = items.map((i) => i.name);
    if (order.join('\u0000') === ingredients.map((i) => i.name).join('\u0000'))
      return;
    await call_recipe_order_ingredients(name, order);
    onreorder(name, order);
  }

  async function deleteRecipe() {
    await call_recipe_delete(name);
    ondelete(name);
  }

  async function addIngredient(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const ingredient = data.get('ingredient') as string | null;
    const amount = parseFloat(data.get('amount') as string);
    if (!ingredient || isNaN(amount)) return;
    form.reset(); // reset synchronously so new input is not wiped after the request
    await upsertIngredient(ingredient, amount);
  }

  async function upsertIngredient(ingredient: string, amount: number) {
    const upsert = { recipe: name, ingredient, amount };
    const recipe = await call_recipe_upsert_ingredient(upsert);
    onupsertIngredient(upsert);
    onupdatePrice(name, recipe.price);
    onupdateAlcohol(name, recipe.alcohol);
  }

  async function deleteIngredient(ingredient: string) {
    const del = { recipe: name, ingredient };
    const recipe = await call_recipe_delete_ingredient(del);
    ondeleteIngredient(del);
    onupdatePrice(name, recipe.price);
    onupdateAlcohol(name, recipe.alcohol);
  }
</script>

<Card ondelete={deleteRecipe} hasAlcohol={alcohol}>
  <div class="flex h-full flex-col items-center justify-between gap-y-2">
    <CardTitle
      title={name}
      suffix="({price.toFixed(2)}€)"
      onrename={(n) => onrename(name, n)}
    />
    <div class="mt-2 flex w-full grow flex-col justify-between gap-y-1">
      <ul
        class="flex flex-col gap-y-1"
        use:dndzone={{
          items,
          dragDisabled,
          flipDurationMs: 150,
          dropTargetStyle: {},
        }}
        onconsider={consider}
        onfinalize={finalize}
      >
        {#each items as ingredient (ingredient.id)}
          <li animate:flip={{ duration: 150 }}>
            <form
              onsubmit={(e) => e.preventDefault()}
              class="flex items-center gap-x-3"
            >
              <DragHandle onpointerdown={() => (dragDisabled = false)} />
              <ItemTitle title={ingredient.name} />
              <ClInput
                class="w-16"
                value={ingredient.amount}
                name="amount"
                required
                onchange={(e) =>
                  upsertIngredient(
                    ingredient.name,
                    Number(e.currentTarget.value),
                  )}
              />
              <MinusButton
                type="button"
                class="ml-4"
                title="Zutat entfernen"
                onclick={() => deleteIngredient(ingredient.name)}
              />
            </form>
          </li>
        {/each}
      </ul>
      {#if ingredients.length > 0}
        <LineSeparator class="my-3" />
        <div class="-mb-3 flex items-center gap-x-3">
          <ItemTitle class="font-semibold" title="Summe" />
          <ItemCl class="mr-10" cl={clSum} />
        </div>
      {/if}
      <div class="mt-auto">
        <LineSeparator class="my-3" title="Zutat hinzufügen" />
        <form onsubmit={addIngredient} class="flex gap-x-3">
          <SelectItems options={ingredientNames} name="ingredient" />
          <ClInput class="w-16" value="0" name="amount" required />
          <PlusButton class="ml-4" type="submit" title="Zutat hinzufügen" />
        </form>
      </div>
    </div>
  </div>
</Card>
