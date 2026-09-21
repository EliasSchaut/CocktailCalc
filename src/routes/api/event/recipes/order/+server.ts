import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { EventOrderBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

/** POST /api/event/recipes/order {event, order: recipeNames[]} */
export const POST: RequestHandler = async (event) => {
  const { event: eventName, order } = await parseBody(event, EventOrderBody);
  return respond(() => calc.reorderEventRecipes(eventName, order));
};
