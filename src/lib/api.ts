import type {
  DataExport,
  ImportResult,
  EventList,
  EventWithRecipes,
  Ingredient,
  RecipeWithIngredients,
} from './types';

// -------------------
// General
// -------------------
export const API_BASE = `${__API_BASE__}/api`;

export enum Method {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Fetch = typeof globalThis.fetch;

async function call_api<T>(
  method: Method,
  path: string,
  data?: unknown,
  fetchFn: Fetch = globalThis.fetch,
): Promise<T> {
  const res = await fetchFn(`${API_BASE}${path}`, {
    method,
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!res.ok)
    throw new ApiError(res.status, (await res.text()) || res.statusText);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// -------------------
// Events
// -------------------
export const call_event_get_many = (fetchFn?: Fetch) =>
  call_api<EventWithRecipes[]>(Method.GET, '/events', undefined, fetchFn);

export const call_event_find = (name: string) =>
  call_api<EventWithRecipes>(Method.GET, `/events/${encodeURIComponent(name)}`);

export const call_event_upsert = (name: string) =>
  call_api<EventWithRecipes>(Method.POST, '/event', { name });

export const call_event_delete = (name: string) =>
  call_api<void>(Method.DELETE, '/event', { name });

export const call_event_upsert_recipe = (upsert: {
  event: string;
  recipe: string;
  amount: number;
}) => call_api<EventWithRecipes>(Method.POST, '/event/recipe', upsert);

export const call_event_delete_recipe = (eventRecipe: {
  event: string;
  recipe: string;
}) => call_api<EventWithRecipes>(Method.DELETE, '/event/recipe', eventRecipe);

export const call_event_ingredient_list = (eventName: string) =>
  call_api<EventList>(
    Method.GET,
    `/event/list/${encodeURIComponent(eventName)}`,
  );

// -------------------
// Recipes
// -------------------
export const call_recipe_get_many = (fetchFn?: Fetch) =>
  call_api<RecipeWithIngredients[]>(Method.GET, '/recipes', undefined, fetchFn);

export const call_recipe_find = (name: string) =>
  call_api<RecipeWithIngredients>(
    Method.GET,
    `/recipes/${encodeURIComponent(name)}`,
  );

export const call_recipe_upsert = (name: string, description?: string) =>
  call_api<RecipeWithIngredients>(Method.POST, '/recipe', {
    name,
    description,
  });

export const call_recipe_delete = (name: string) =>
  call_api<void>(Method.DELETE, '/recipe', { name });

export const call_recipe_upsert_ingredient = (upsert: {
  recipe: string;
  ingredient: string;
  amount: number;
}) =>
  call_api<RecipeWithIngredients>(Method.POST, '/recipe/ingredient', upsert);

export const call_recipe_delete_ingredient = (recipeIngredient: {
  recipe: string;
  ingredient: string;
}) =>
  call_api<RecipeWithIngredients>(
    Method.DELETE,
    '/recipe/ingredient',
    recipeIngredient,
  );

// -------------------
// Ingredients
// -------------------
export const call_ingredient_get_many = (fetchFn?: Fetch) =>
  call_api<Ingredient[]>(Method.GET, '/ingredients', undefined, fetchFn);

export const call_ingredient_upsert = (
  name: string,
  price: number,
  alcohol = false,
) => call_api<void>(Method.POST, '/ingredient', { name, price, alcohol });

export const call_ingredient_delete = (name: string) =>
  call_api<void>(Method.DELETE, '/ingredient', { name });

// -------------------
// Export / Import
// -------------------
export const EXPORT_URL = `${API_BASE}/export`;

export const call_export = () => call_api<DataExport>(Method.GET, '/export');

export const call_import = (data: DataExport, mode: 'merge' | 'replace') =>
  call_api<ImportResult>(Method.POST, `/import?mode=${mode}`, data);
