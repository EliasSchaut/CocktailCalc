import { calc } from '$lib/server';
import { respond } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) =>
  respond(() => calc.findRecipe(params.name));
