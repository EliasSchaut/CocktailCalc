import { ConflictError, NotFoundError, type CalcService } from '$lib/db/calc';
import type { DataExport } from '$lib/types';
import { ApiError } from '../apiError';
import { getLocalDb } from './db';

// Local implementation of the API for the Tauri app: same functions and return
// shapes as apiRemote.ts, backed by the sql.js database instead of HTTP.

async function query<T>(fn: (calc: CalcService) => T): Promise<T> {
  const { calc } = await getLocalDb();
  return run(() => fn(calc));
}

async function mutate<T>(fn: (calc: CalcService) => T): Promise<T> {
  const { calc, persist } = await getLocalDb();
  const result = run(() => fn(calc));
  await persist();
  return result;
}

function run<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof NotFoundError) throw new ApiError(404, e.message);
    if (e instanceof ConflictError) throw new ApiError(409, e.message);
    if (e instanceof Error && /FOREIGN KEY constraint failed/.test(e.message)) {
      throw new ApiError(404, 'Referenced item does not exist');
    }
    throw e;
  }
}

// ---- events
export const call_event_get_many = () => query((c) => c.getEvents());
export const call_event_find = (name: string) =>
  query((c) => c.findEvent(name));
export const call_event_upsert = (name: string) =>
  mutate((c) => c.addEvent(name));
export const call_event_delete = (name: string) =>
  mutate((c) => c.deleteEvent(name));
export const call_event_upsert_recipe = (u: {
  event: string;
  recipe: string;
  amount: number;
}) => mutate((c) => c.addEventRecipe(u.event, u.recipe, u.amount));
export const call_event_delete_recipe = (d: {
  event: string;
  recipe: string;
}) => mutate((c) => c.deleteEventRecipe(d.event, d.recipe));
export const call_event_ingredient_list = (event: string) =>
  query((c) => c.getEventList(event));

// ---- recipes
export const call_recipe_get_many = () => query((c) => c.getRecipes());
export const call_recipe_find = (name: string) =>
  query((c) => c.findRecipe(name));
export const call_recipe_upsert = (name: string, description = '') =>
  mutate((c) => c.addRecipe(name, description));
export const call_recipe_delete = (name: string) =>
  mutate((c) => c.deleteRecipe(name));
export const call_recipe_upsert_ingredient = (u: {
  recipe: string;
  ingredient: string;
  amount: number;
}) => mutate((c) => c.addIngredientAmount(u.recipe, u.ingredient, u.amount));
export const call_recipe_delete_ingredient = (d: {
  recipe: string;
  ingredient: string;
}) => mutate((c) => c.deleteRecipeIngredient(d.recipe, d.ingredient));

// ---- ingredients
export const call_ingredient_get_many = () => query((c) => c.getIngredients());
export const call_ingredient_upsert = (
  name: string,
  price: number,
  alcohol = false,
) => mutate((c) => c.addIngredient(name, price, alcohol));
export const call_ingredient_delete = (name: string) =>
  mutate((c) => c.deleteIngredient(name));

// ---- export / import
export const call_export = () => query((c) => c.exportAll());
export const call_import = (data: DataExport, mode: 'merge' | 'replace') =>
  mutate((c) => c.importAll(data, mode === 'replace'));

// ---- rename
export const call_ingredient_rename = (name: string, newName: string) =>
  mutate((c) => c.renameIngredient(name, newName));
export const call_recipe_rename = (name: string, newName: string) =>
  mutate((c) => c.renameRecipe(name, newName));
export const call_event_rename = (name: string, newName: string) =>
  mutate((c) => c.renameEvent(name, newName));

// ---- ordering
export const call_recipe_order_ingredients = (
  recipe: string,
  order: string[],
) => mutate((c) => c.reorderRecipeIngredients(recipe, order));
export const call_event_order_recipes = (event: string, order: string[]) =>
  mutate((c) => c.reorderEventRecipes(event, order));
