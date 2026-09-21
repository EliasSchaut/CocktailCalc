import { call_ingredient_get_many, call_recipe_get_many } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const [recipes, ingredients] = await Promise.all([
    call_recipe_get_many(fetch),
    call_ingredient_get_many(fetch),
  ]);
  return { recipes, ingredientNames: ingredients.map((i) => i.name) };
};
