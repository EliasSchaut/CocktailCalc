// API facade: the web build talks to the SvelteKit server, the Tauri app uses the
// local sql.js database. `__TAURI_BUILD__` is a build-time constant, so the other
// implementation is never bundled.
import type * as Remote from './apiRemote';

export { ApiError } from './apiError';

// only the call_* functions are shared between both implementations
type Api = {
  [
    K in keyof typeof Remote as K extends `call_${string}` ? K : never
  ]: (typeof Remote)[K];
};

const impl: Promise<Api> = __TAURI_BUILD__
  ? import('./local/api')
  : import('./apiRemote');

function bind<K extends keyof Api>(name: K): Api[K] {
  return (async (...args: unknown[]) => {
    const api = await impl;
    return (api[name] as (...a: unknown[]) => unknown)(...args);
  }) as Api[K];
}

export const call_event_get_many = bind('call_event_get_many');
export const call_event_find = bind('call_event_find');
export const call_event_upsert = bind('call_event_upsert');
export const call_event_delete = bind('call_event_delete');
export const call_event_upsert_recipe = bind('call_event_upsert_recipe');
export const call_event_delete_recipe = bind('call_event_delete_recipe');
export const call_event_ingredient_list = bind('call_event_ingredient_list');
export const call_recipe_get_many = bind('call_recipe_get_many');
export const call_recipe_find = bind('call_recipe_find');
export const call_recipe_upsert = bind('call_recipe_upsert');
export const call_recipe_delete = bind('call_recipe_delete');
export const call_recipe_upsert_ingredient = bind(
  'call_recipe_upsert_ingredient',
);
export const call_recipe_delete_ingredient = bind(
  'call_recipe_delete_ingredient',
);
export const call_ingredient_get_many = bind('call_ingredient_get_many');
export const call_ingredient_upsert = bind('call_ingredient_upsert');
export const call_ingredient_delete = bind('call_ingredient_delete');
export const call_export = bind('call_export');
export const call_import = bind('call_import');
export const call_ingredient_rename = bind('call_ingredient_rename');
export const call_recipe_rename = bind('call_recipe_rename');
export const call_event_rename = bind('call_event_rename');
export const call_recipe_order_ingredients = bind(
  'call_recipe_order_ingredients',
);
export const call_event_order_recipes = bind('call_event_order_recipes');
