import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { DeleteEventRecipeBody, EventRecipeBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const {
    event: eventName,
    recipe,
    amount,
  } = await parseBody(event, EventRecipeBody);
  return respond(() => calc.addEventRecipe(eventName, recipe, amount));
};

export const DELETE: RequestHandler = async (event) => {
  const { event: eventName, recipe } = await parseBody(
    event,
    DeleteEventRecipeBody,
  );
  return respond(() => calc.deleteEventRecipe(eventName, recipe));
};
