import { and, asc, eq } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import {
  eventRecipes,
  events,
  ingredients,
  recipeIngredients,
  recipes,
} from './db/schema.ts';
import type {
  DataExport,
  EventList,
  EventWithRecipes,
  ImportResult,
  Ingredient,
  RecipeWithIngredients,
} from '$lib/types';

/*
Note: It is important to update the prices whenever an operation may change them!
This is done via `updateRecipePrice` (which also updates event prices) and `updateEventPrice`.
All mutating operations run in a transaction so prices are always consistent.
*/

export class NotFoundError extends Error {}

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name);

export function createCalcService(db: Db) {
  // ---------- price maintenance ----------

  function updateEventPrice(name: string) {
    const rows = db
      .select({ amount: eventRecipes.amount, price: recipes.price })
      .from(eventRecipes)
      .innerJoin(recipes, eq(eventRecipes.recipeName, recipes.name))
      .where(eq(eventRecipes.eventName, name))
      .all();
    const price = rows.reduce((sum, r) => sum + r.amount * r.price, 0);
    db.update(events).set({ price }).where(eq(events.name, name)).run();
  }

  function updateRecipePrice(name: string) {
    const rows = db
      .select({
        amount: recipeIngredients.amount,
        price: ingredients.price,
        alcohol: ingredients.alcohol,
      })
      .from(recipeIngredients)
      .innerJoin(
        ingredients,
        eq(recipeIngredients.ingredientName, ingredients.name),
      )
      .where(eq(recipeIngredients.recipeName, name))
      .all();
    // prices are in €/l, but ingredient amounts are in cl
    const price = rows.reduce((sum, r) => sum + r.amount * r.price, 0) / 100;
    const alcohol = rows.some((r) => r.alcohol);
    db.update(recipes)
      .set({ price, alcohol })
      .where(eq(recipes.name, name))
      .run();

    const affectedEvents = db
      .select({ eventName: eventRecipes.eventName })
      .from(eventRecipes)
      .where(eq(eventRecipes.recipeName, name))
      .all();
    for (const { eventName } of affectedEvents) updateEventPrice(eventName);
  }

  function recipesUsingIngredient(ingredient: string): string[] {
    return db
      .select({ recipeName: recipeIngredients.recipeName })
      .from(recipeIngredients)
      .where(eq(recipeIngredients.ingredientName, ingredient))
      .all()
      .map((r) => r.recipeName);
  }

  function eventsUsingRecipe(recipe: string): string[] {
    return db
      .select({ eventName: eventRecipes.eventName })
      .from(eventRecipes)
      .where(eq(eventRecipes.recipeName, recipe))
      .all()
      .map((r) => r.eventName);
  }

  // ---------- ingredients ----------

  function getIngredients(): Ingredient[] {
    return db.select().from(ingredients).orderBy(asc(ingredients.name)).all();
  }

  function addIngredient(name: string, price: number, alcohol: boolean): void {
    db.transaction((tx) => {
      tx.insert(ingredients)
        .values({ name, price, alcohol })
        .onConflictDoUpdate({
          target: ingredients.name,
          set: { price, alcohol },
        })
        .run();
      for (const recipe of recipesUsingIngredient(name))
        updateRecipePrice(recipe);
    });
  }

  function deleteIngredient(name: string): void {
    db.transaction(() => {
      const affected = recipesUsingIngredient(name);
      const deleted = db
        .delete(ingredients)
        .where(eq(ingredients.name, name))
        .run();
      if (deleted.changes === 0)
        throw new NotFoundError(`ingredient "${name}" not found`);
      for (const recipe of affected) updateRecipePrice(recipe);
    });
  }

  // ---------- recipes ----------

  function toRecipe(row: {
    name: string;
    description: string | null;
    price: number;
    alcohol: boolean;
    ingredients: { ingredientName: string; amount: number }[];
  }): RecipeWithIngredients {
    return {
      name: row.name,
      description: row.description,
      price: row.price,
      alcohol: row.alcohol,
      ingredients: row.ingredients
        .map((i) => ({ name: i.ingredientName, amount: i.amount }))
        .sort(byName),
    };
  }

  function getRecipes(): RecipeWithIngredients[] {
    return db.query.recipes
      .findMany({ with: { ingredients: true }, orderBy: asc(recipes.name) })
      .sync()
      .map(toRecipe);
  }

  function findRecipe(name: string): RecipeWithIngredients {
    const row = db.query.recipes
      .findFirst({ where: eq(recipes.name, name), with: { ingredients: true } })
      .sync();
    if (!row) throw new NotFoundError(`recipe "${name}" not found`);
    return toRecipe(row);
  }

  function addRecipe(name: string, description: string): RecipeWithIngredients {
    db.insert(recipes)
      .values({ name, description, price: 0 })
      .onConflictDoUpdate({ target: recipes.name, set: { description } })
      .run();
    return findRecipe(name);
  }

  function addIngredientAmount(
    recipe: string,
    ingredient: string,
    amount: number,
  ): RecipeWithIngredients {
    return db.transaction(() => {
      db.insert(recipeIngredients)
        .values({ recipeName: recipe, ingredientName: ingredient, amount })
        .onConflictDoUpdate({
          target: [
            recipeIngredients.recipeName,
            recipeIngredients.ingredientName,
          ],
          set: { amount },
        })
        .run();
      updateRecipePrice(recipe);
      return findRecipe(recipe);
    });
  }

  function deleteRecipe(name: string): void {
    db.transaction(() => {
      const affected = eventsUsingRecipe(name);
      const deleted = db.delete(recipes).where(eq(recipes.name, name)).run();
      if (deleted.changes === 0)
        throw new NotFoundError(`recipe "${name}" not found`);
      for (const event of affected) updateEventPrice(event);
    });
  }

  function deleteRecipeIngredient(
    recipe: string,
    ingredient: string,
  ): RecipeWithIngredients {
    return db.transaction(() => {
      db.delete(recipeIngredients)
        .where(
          and(
            eq(recipeIngredients.recipeName, recipe),
            eq(recipeIngredients.ingredientName, ingredient),
          ),
        )
        .run();
      updateRecipePrice(recipe);
      return findRecipe(recipe);
    });
  }

  // ---------- events ----------

  function toEvent(row: {
    name: string;
    price: number;
    recipes: { recipeName: string; amount: number }[];
  }): EventWithRecipes {
    return {
      name: row.name,
      price: row.price,
      recipes: row.recipes
        .map((r) => ({ name: r.recipeName, amount: r.amount }))
        .sort(byName),
    };
  }

  function getEvents(): EventWithRecipes[] {
    return db.query.events
      .findMany({ with: { recipes: true }, orderBy: asc(events.name) })
      .sync()
      .map(toEvent);
  }

  function findEvent(name: string): EventWithRecipes {
    const row = db.query.events
      .findFirst({ where: eq(events.name, name), with: { recipes: true } })
      .sync();
    if (!row) throw new NotFoundError(`event "${name}" not found`);
    return toEvent(row);
  }

  function addEvent(name: string): EventWithRecipes {
    db.insert(events).values({ name, price: 0 }).onConflictDoNothing().run();
    return findEvent(name);
  }

  function addEventRecipe(
    event: string,
    recipe: string,
    amount: number,
  ): EventWithRecipes {
    return db.transaction(() => {
      db.insert(eventRecipes)
        .values({ eventName: event, recipeName: recipe, amount })
        .onConflictDoUpdate({
          target: [eventRecipes.eventName, eventRecipes.recipeName],
          set: { amount },
        })
        .run();
      updateEventPrice(event);
      return findEvent(event);
    });
  }

  function deleteEvent(name: string): void {
    const deleted = db.delete(events).where(eq(events.name, name)).run();
    if (deleted.changes === 0)
      throw new NotFoundError(`event "${name}" not found`);
  }

  function deleteEventRecipe(event: string, recipe: string): EventWithRecipes {
    return db.transaction(() => {
      db.delete(eventRecipes)
        .where(
          and(
            eq(eventRecipes.eventName, event),
            eq(eventRecipes.recipeName, recipe),
          ),
        )
        .run();
      updateEventPrice(event);
      return findEvent(event);
    });
  }

  /** Buying list for an event; amounts are in litres. */
  function getEventList(name: string): EventList {
    const event = db.query.events
      .findFirst({
        where: eq(events.name, name),
        with: {
          recipes: { with: { recipe: { with: { ingredients: true } } } },
        },
      })
      .sync();
    if (!event) throw new NotFoundError(`event "${name}" not found`);

    const amounts = new Map<string, number>();
    for (const cocktail of event.recipes) {
      for (const ingredient of cocktail.recipe.ingredients) {
        const old = amounts.get(ingredient.ingredientName) ?? 0;
        const litres = (cocktail.amount * ingredient.amount) / 100;
        amounts.set(ingredient.ingredientName, old + litres);
      }
    }
    const list = Array.from(amounts.entries())
      .filter(([, amount]) => amount > 0)
      .map(([name, amount]) => ({ name, amount }))
      .sort(byName);
    return { ingredients: list, price: event.price };
  }

  // ---------- export / import ----------

  /** Dumps all data (prices of recipes/events are derived and therefore omitted). */
  function exportAll(): DataExport {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      ingredients: getIngredients(),
      recipes: getRecipes().map(({ name, description, ingredients }) => ({
        name,
        description,
        ingredients,
      })),
      events: getEvents().map(({ name, recipes }) => ({ name, recipes })),
    };
  }

  /**
   * Imports a dump. `replace` wipes all existing data first, otherwise items are
   * merged (upserted) into the existing data. Prices are recalculated afterwards.
   */
  function importAll(data: DataExport, replace = false): ImportResult {
    return db.transaction(() => {
      if (replace) {
        db.delete(events).run();
        db.delete(recipes).run();
        db.delete(ingredients).run();
      }
      for (const i of data.ingredients) {
        db.insert(ingredients)
          .values(i)
          .onConflictDoUpdate({
            target: ingredients.name,
            set: { price: i.price, alcohol: i.alcohol },
          })
          .run();
      }
      for (const r of data.recipes) {
        db.insert(recipes)
          .values({ name: r.name, description: r.description, price: 0 })
          .onConflictDoUpdate({
            target: recipes.name,
            set: { description: r.description },
          })
          .run();
        for (const i of r.ingredients) {
          db.insert(recipeIngredients)
            .values({
              recipeName: r.name,
              ingredientName: i.name,
              amount: i.amount,
            })
            .onConflictDoUpdate({
              target: [
                recipeIngredients.recipeName,
                recipeIngredients.ingredientName,
              ],
              set: { amount: i.amount },
            })
            .run();
        }
      }
      for (const e of data.events) {
        db.insert(events)
          .values({ name: e.name, price: 0 })
          .onConflictDoNothing()
          .run();
        for (const r of e.recipes) {
          db.insert(eventRecipes)
            .values({ eventName: e.name, recipeName: r.name, amount: r.amount })
            .onConflictDoUpdate({
              target: [eventRecipes.eventName, eventRecipes.recipeName],
              set: { amount: r.amount },
            })
            .run();
        }
      }
      // recalculating every recipe also refreshes all event prices
      for (const { name } of db
        .select({ name: recipes.name })
        .from(recipes)
        .all()) {
        updateRecipePrice(name);
      }
      return {
        ingredients: data.ingredients.length,
        recipes: data.recipes.length,
        events: data.events.length,
      };
    });
  }

  return {
    exportAll,
    importAll,
    getIngredients,
    addIngredient,
    deleteIngredient,
    getRecipes,
    findRecipe,
    addRecipe,
    addIngredientAmount,
    deleteRecipe,
    deleteRecipeIngredient,
    getEvents,
    findEvent,
    addEvent,
    addEventRecipe,
    deleteEvent,
    deleteEventRecipe,
    getEventList,
    updateRecipePrice,
  };
}

export type CalcService = ReturnType<typeof createCalcService>;
