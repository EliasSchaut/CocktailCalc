import { calc } from '$lib/server';
import { parseBody, respond } from '$lib/server/http';
import { RenameBody } from '$lib/server/validation';
import type { RequestHandler } from './$types';

/** POST /api/recipe/rename {name, newName} */
export const POST: RequestHandler = async (event) => {
  const { name, newName } = await parseBody(event, RenameBody);
  return respond(() => calc.renameRecipe(name, newName));
};
