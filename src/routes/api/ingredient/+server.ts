import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { IngredientBody, NameBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { name, price, alcohol } = await parseBody(event, IngredientBody);
  return respond(() => calc.addIngredient(name, price, alcohol));
};

export const DELETE: RequestHandler = async (event) => {
  const { name } = await parseBody(event, NameBody);
  return respond(() => calc.deleteIngredient(name));
};
