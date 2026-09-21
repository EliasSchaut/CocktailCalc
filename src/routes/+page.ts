import { call_event_get_many, call_recipe_get_many } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const [events, recipes] = await Promise.all([
    call_event_get_many(fetch),
    call_recipe_get_many(fetch),
  ]);
  return {
    events,
    recipeNames: recipes.map((r) => r.name),
    alcoholicRecipes: recipes.filter((r) => r.alcohol).map((r) => r.name),
  };
};
