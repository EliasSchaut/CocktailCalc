import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import {
  DeleteRecipeIngredientBody,
  RecipeIngredientBody,
} from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { recipe, ingredient, amount } = await parseBody(
    event,
    RecipeIngredientBody,
  );
  return respond(() => calc.addIngredientAmount(recipe, ingredient, amount));
};

export const DELETE: RequestHandler = async (event) => {
  const { recipe, ingredient } = await parseBody(
    event,
    DeleteRecipeIngredientBody,
  );
  return respond(() => calc.deleteRecipeIngredient(recipe, ingredient));
};
