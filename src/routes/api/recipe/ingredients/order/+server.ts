import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { RecipeOrderBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

/** POST /api/recipe/ingredients/order {recipe, order: ingredientNames[]} */
export const POST: RequestHandler = async (event) => {
  const { recipe, order } = await parseBody(event, RecipeOrderBody);
  return respond(() => calc.reorderRecipeIngredients(recipe, order));
};
