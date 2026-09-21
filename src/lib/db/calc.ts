import { and, asc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema.ts';
import {
  eventRecipes,
  events,
  ingredients,
  recipeIngredients,
  recipes,
} from './schema.ts';
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

/** Any synchronous Drizzle SQLite database (better-sqlite3 on the server, sql.js in the app). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = BaseSQLiteDatabase<'sync', any, typeof schema>;

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

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

  /** SQL expression for the next free position in a junction table, scoped by `where`. */
  function nextPosition(
    table: typeof recipeIngredients | typeof eventRecipes,
    where: ReturnType<typeof eq>,
  ) {
    return sql<number>`(select coalesce(max(${table.position}), 0) + 1 from ${table} where ${where})`;
  }

  // ---------- ordering ----------

  /** Sets the display order of a recipe's ingredients; names not listed keep their position. */
  function reorderRecipeIngredients(
    recipe: string,
    order: string[],
  ): RecipeWithIngredients {
    return db.transaction(() => {
      order.forEach((ingredient, idx) => {
        db.update(recipeIngredients)
          .set({ position: idx + 1 })
          .where(
            and(
              eq(recipeIngredients.recipeName, recipe),
              eq(recipeIngredients.ingredientName, ingredient),
            ),
          )
          .run();
      });
      return findRecipe(recipe);
    });
  }

  /** Sets the display order of an event's recipes; names not listed keep their position. */
  function reorderEventRecipes(
    event: string,
    order: string[],
  ): EventWithRecipes {
    return db.transaction(() => {
      order.forEach((recipe, idx) => {
        db.update(eventRecipes)
          .set({ position: idx + 1 })
          .where(
            and(
              eq(eventRecipes.eventName, event),
              eq(eventRecipes.recipeName, recipe),
            ),
          )
          .run();
      });
      return findEvent(event);
    });
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
      if (
        !db
          .select({ name: ingredients.name })
          .from(ingredients)
          .where(eq(ingredients.name, name))
          .get()
      ) {
        throw new NotFoundError(`ingredient "${name}" not found`);
      }
      db.delete(ingredients).where(eq(ingredients.name, name)).run();
      for (const recipe of affected) updateRecipePrice(recipe);
    });
  }

  // ---------- recipes ----------

  /** Loads recipes (all, or the ones matching `where`) with their ingredients in display order. */
  function loadRecipes(where?: SQL): RecipeWithIngredients[] {
    const rows = db
      .select()
      .from(recipes)
      .where(where)
      .orderBy(asc(recipes.name))
      .all();
    if (rows.length === 0) return [];
    const parts = db
      .select({
        recipeName: recipeIngredients.recipeName,
        name: recipeIngredients.ingredientName,
        amount: recipeIngredients.amount,
      })
      .from(recipeIngredients)
      .where(
        where
          ? inArray(
              recipeIngredients.recipeName,
              rows.map((r) => r.name),
            )
          : undefined,
      )
      .orderBy(asc(recipeIngredients.position))
      .all();
    return rows.map((r) => ({
      name: r.name,
      description: r.description,
      price: r.price,
      alcohol: r.alcohol,
      ingredients: parts
        .filter((p) => p.recipeName === r.name)
        .map(({ name, amount }) => ({ name, amount })),
    }));
  }

  function getRecipes(): RecipeWithIngredients[] {
    return loadRecipes();
  }

  function findRecipe(name: string): RecipeWithIngredients {
    const [recipe] = loadRecipes(eq(recipes.name, name));
    if (!recipe) throw new NotFoundError(`recipe "${name}" not found`);
    return recipe;
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
        .values({
          recipeName: recipe,
          ingredientName: ingredient,
          amount,
          position: nextPosition(
            recipeIngredients,
            eq(recipeIngredients.recipeName, recipe),
          ),
        })
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
      if (
        !db
          .select({ name: recipes.name })
          .from(recipes)
          .where(eq(recipes.name, name))
          .get()
      ) {
        throw new NotFoundError(`recipe "${name}" not found`);
      }
      db.delete(recipes).where(eq(recipes.name, name)).run();
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

  /** Loads events (all, or the ones matching `where`) with their recipes in display order. */
  function loadEvents(where?: SQL): EventWithRecipes[] {
    const rows = db
      .select()
      .from(events)
      .where(where)
      .orderBy(asc(events.name))
      .all();
    if (rows.length === 0) return [];
    const parts = db
      .select({
        eventName: eventRecipes.eventName,
        name: eventRecipes.recipeName,
        amount: eventRecipes.amount,
      })
      .from(eventRecipes)
      .where(
        where
          ? inArray(
              eventRecipes.eventName,
              rows.map((e) => e.name),
            )
          : undefined,
      )
      .orderBy(asc(eventRecipes.position))
      .all();
    return rows.map((e) => ({
      name: e.name,
      price: e.price,
      recipes: parts
        .filter((p) => p.eventName === e.name)
        .map(({ name, amount }) => ({ name, amount })),
    }));
  }

  function getEvents(): EventWithRecipes[] {
    return loadEvents();
  }

  function findEvent(name: string): EventWithRecipes {
    const [event] = loadEvents(eq(events.name, name));
    if (!event) throw new NotFoundError(`event "${name}" not found`);
    return event;
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
        .values({
          eventName: event,
          recipeName: recipe,
          amount,
          position: nextPosition(
            eventRecipes,
            eq(eventRecipes.eventName, event),
          ),
        })
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
    if (
      !db
        .select({ name: events.name })
        .from(events)
        .where(eq(events.name, name))
        .get()
    ) {
      throw new NotFoundError(`event "${name}" not found`);
    }
    db.delete(events).where(eq(events.name, name)).run();
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
    const event = db.select().from(events).where(eq(events.name, name)).get();
    if (!event) throw new NotFoundError(`event "${name}" not found`);

    const rows = db
      .select({
        ingredient: recipeIngredients.ingredientName,
        cl: recipeIngredients.amount,
        count: eventRecipes.amount,
      })
      .from(eventRecipes)
      .innerJoin(
        recipeIngredients,
        eq(recipeIngredients.recipeName, eventRecipes.recipeName),
      )
      .where(eq(eventRecipes.eventName, name))
      .all();

    const amounts = new Map<string, number>();
    for (const r of rows) {
      amounts.set(
        r.ingredient,
        (amounts.get(r.ingredient) ?? 0) + (r.count * r.cl) / 100,
      );
    }
    const list = Array.from(amounts.entries())
      .filter(([, amount]) => amount > 0)
      .map(([name, amount]) => ({ name, amount }))
      .sort(byName);
    return { ingredients: list, price: event.price };
  }

  // ---------- rename ----------
  // Names are primary keys referenced by the junction tables (no ON UPDATE CASCADE),
  // so a rename copies the row under the new name, re-points the references and
  // removes the old row, all inside one transaction.

  function assertRename(
    table: 'ingredient' | 'recipe' | 'event',
    oldName: string,
    newName: string,
  ) {
    if (oldName === newName)
      throw new ConflictError(`new name equals the old name`);
    const t = { ingredient: ingredients, recipe: recipes, event: events }[
      table
    ];
    if (db.select({ name: t.name }).from(t).where(eq(t.name, newName)).get()) {
      throw new ConflictError(`${table} "${newName}" already exists`);
    }
  }

  function renameIngredient(oldName: string, newName: string): Ingredient {
    return db.transaction(() => {
      assertRename('ingredient', oldName, newName);
      const row = db
        .select()
        .from(ingredients)
        .where(eq(ingredients.name, oldName))
        .get();
      if (!row) throw new NotFoundError(`ingredient "${oldName}" not found`);
      db.insert(ingredients)
        .values({ ...row, name: newName })
        .run();
      db.update(recipeIngredients)
        .set({ ingredientName: newName })
        .where(eq(recipeIngredients.ingredientName, oldName))
        .run();
      db.delete(ingredients).where(eq(ingredients.name, oldName)).run();
      return { ...row, name: newName };
    });
  }

  function renameRecipe(
    oldName: string,
    newName: string,
  ): RecipeWithIngredients {
    return db.transaction(() => {
      assertRename('recipe', oldName, newName);
      const row = db
        .select()
        .from(recipes)
        .where(eq(recipes.name, oldName))
        .get();
      if (!row) throw new NotFoundError(`recipe "${oldName}" not found`);
      db.insert(recipes)
        .values({ ...row, name: newName })
        .run();
      db.update(recipeIngredients)
        .set({ recipeName: newName })
        .where(eq(recipeIngredients.recipeName, oldName))
        .run();
      db.update(eventRecipes)
        .set({ recipeName: newName })
        .where(eq(eventRecipes.recipeName, oldName))
        .run();
      db.delete(recipes).where(eq(recipes.name, oldName)).run();
      return findRecipe(newName);
    });
  }

  function renameEvent(oldName: string, newName: string): EventWithRecipes {
    return db.transaction(() => {
      assertRename('event', oldName, newName);
      const row = db
        .select()
        .from(events)
        .where(eq(events.name, oldName))
        .get();
      if (!row) throw new NotFoundError(`event "${oldName}" not found`);
      db.insert(events)
        .values({ ...row, name: newName })
        .run();
      db.update(eventRecipes)
        .set({ eventName: newName })
        .where(eq(eventRecipes.eventName, oldName))
        .run();
      db.delete(events).where(eq(events.name, oldName)).run();
      return findEvent(newName);
    });
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
        for (const [idx, i] of r.ingredients.entries()) {
          db.insert(recipeIngredients)
            .values({
              recipeName: r.name,
              ingredientName: i.name,
              amount: i.amount,
              position: idx + 1,
            })
            .onConflictDoUpdate({
              target: [
                recipeIngredients.recipeName,
                recipeIngredients.ingredientName,
              ],
              set: { amount: i.amount, position: idx + 1 },
            })
            .run();
        }
      }
      for (const e of data.events) {
        db.insert(events)
          .values({ name: e.name, price: 0 })
          .onConflictDoNothing()
          .run();
        for (const [idx, r] of e.recipes.entries()) {
          db.insert(eventRecipes)
            .values({
              eventName: e.name,
              recipeName: r.name,
              amount: r.amount,
              position: idx + 1,
            })
            .onConflictDoUpdate({
              target: [eventRecipes.eventName, eventRecipes.recipeName],
              set: { amount: r.amount, position: idx + 1 },
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
    reorderRecipeIngredients,
    reorderEventRecipes,
    renameIngredient,
    renameRecipe,
    renameEvent,
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
