import { call_ingredient_get_many } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  return { ingredients: await call_ingredient_get_many(fetch) };
};
