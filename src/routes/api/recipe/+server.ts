import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { NameBody, RecipeBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { name, description } = await parseBody(event, RecipeBody);
  return respond(() => calc.addRecipe(name, description));
};

export const DELETE: RequestHandler = async (event) => {
  const { name } = await parseBody(event, NameBody);
  return respond(() => calc.deleteRecipe(name));
};
