/**
 * One-off import of data from the old Prisma database (Postgres or SQLite)
 * into the new Drizzle/SQLite database.
 *
 * Usage:
 *   OLD_DATABASE_URL=postgresql://user:pass@host:5432/db pnpm db:import
 *   OLD_DATABASE_URL=file:./old.sqlite3                   pnpm db:import
 *
 * Target database: DATABASE_URL (default ./db.sqlite3). Migrations are applied
 * automatically. The import is idempotent (upserts) and recalculates all prices.
 *
 * Runs directly with Node >= 22.18 (native type stripping), no build step needed.
 */
import Database from 'better-sqlite3';
import { createCalcService } from '../src/lib/server/calc.ts';
import { createDb } from '../src/lib/server/db/client.ts';
import {
  eventRecipes,
  events,
  ingredients,
  recipeIngredients,
  recipes,
} from '../src/lib/server/db/schema.ts';

type OldIngredient = { name: string; price: number; alcohol: boolean | number };
type OldRecipe = {
  name: string;
  description: string | null;
  price: number;
  alcohol: boolean | number;
};
type OldIngredientAmount = {
  recipeName: string;
  ingredientName: string;
  amount: number;
};
type OldEvent = { name: string; price: number };
type OldRecipeAmount = {
  eventName: string;
  recipeName: string;
  amount: number;
};

type OldData = {
  ingredients: OldIngredient[];
  recipes: OldRecipe[];
  ingredientAmounts: OldIngredientAmount[];
  events: OldEvent[];
  recipeAmounts: OldRecipeAmount[];
};

const QUERIES = {
  ingredients: 'SELECT "name", "price", "alcohol" FROM "Ingredient"',
  recipes: 'SELECT "name", "description", "price", "alcohol" FROM "Recipe"',
  ingredientAmounts:
    'SELECT "recipeName", "ingredientName", "amount" FROM "IngredientAmount"',
  events: 'SELECT "name", "price" FROM "Event"',
  recipeAmounts:
    'SELECT "eventName", "recipeName", "amount" FROM "RecipeAmount"',
} as const;

async function readOld(url: string): Promise<OldData> {
  if (/^postgres(ql)?:\/\//.test(url)) {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
      const q = async <T>(sql: string) => (await client.query<T>(sql)).rows;
      return {
        ingredients: await q<OldIngredient>(QUERIES.ingredients),
        recipes: await q<OldRecipe>(QUERIES.recipes),
        ingredientAmounts: await q<OldIngredientAmount>(
          QUERIES.ingredientAmounts,
        ),
        events: await q<OldEvent>(QUERIES.events),
        recipeAmounts: await q<OldRecipeAmount>(QUERIES.recipeAmounts),
      };
    } finally {
      await client.end();
    }
  }

  const sqlite = new Database(url.replace(/^file:/, ''), { readonly: true });
  try {
    const q = <T>(sql: string) => sqlite.prepare(sql).all() as T[];
    return {
      ingredients: q<OldIngredient>(QUERIES.ingredients),
      recipes: q<OldRecipe>(QUERIES.recipes),
      ingredientAmounts: q<OldIngredientAmount>(QUERIES.ingredientAmounts),
      events: q<OldEvent>(QUERIES.events),
      recipeAmounts: q<OldRecipeAmount>(QUERIES.recipeAmounts),
    };
  } finally {
    sqlite.close();
  }
}

async function main() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  if (!oldUrl) {
    console.error(
      'OLD_DATABASE_URL is not set (postgres URL or path to the old SQLite file)',
    );
    process.exit(1);
  }
  const newUrl = process.env.DATABASE_URL ?? './db.sqlite3';

  console.log(
    `Reading old data from ${oldUrl.replace(/:\/\/.*@/, '://***@')} …`,
  );
  const old = await readOld(oldUrl);
  console.log(
    `  ${old.ingredients.length} ingredients, ${old.recipes.length} recipes, ` +
      `${old.ingredientAmounts.length} recipe ingredients, ${old.events.length} events, ` +
      `${old.recipeAmounts.length} event recipes`,
  );

  console.log(`Writing to ${newUrl} …`);
  const db = createDb(newUrl);

  db.transaction(() => {
    for (const i of old.ingredients) {
      const row = { name: i.name, price: i.price, alcohol: Boolean(i.alcohol) };
      db.insert(ingredients)
        .values(row)
        .onConflictDoUpdate({ target: ingredients.name, set: row })
        .run();
    }
    for (const r of old.recipes) {
      const row = {
        name: r.name,
        description: r.description,
        price: r.price,
        alcohol: Boolean(r.alcohol),
      };
      db.insert(recipes)
        .values(row)
        .onConflictDoUpdate({ target: recipes.name, set: row })
        .run();
    }
    for (const ia of old.ingredientAmounts) {
      db.insert(recipeIngredients)
        .values({
          recipeName: ia.recipeName,
          ingredientName: ia.ingredientName,
          amount: ia.amount,
        })
        .onConflictDoUpdate({
          target: [
            recipeIngredients.recipeName,
            recipeIngredients.ingredientName,
          ],
          set: { amount: ia.amount },
        })
        .run();
    }
    for (const e of old.events) {
      db.insert(events)
        .values({ name: e.name, price: e.price })
        .onConflictDoUpdate({ target: events.name, set: { price: e.price } })
        .run();
    }
    for (const ra of old.recipeAmounts) {
      db.insert(eventRecipes)
        .values({
          eventName: ra.eventName,
          recipeName: ra.recipeName,
          amount: ra.amount,
        })
        .onConflictDoUpdate({
          target: [eventRecipes.eventName, eventRecipes.recipeName],
          set: { amount: ra.amount },
        })
        .run();
    }

    // recalculate all denormalised prices (also cascades to events)
    const calc = createCalcService(db);
    for (const r of old.recipes) calc.updateRecipePrice(r.name);
  });

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
