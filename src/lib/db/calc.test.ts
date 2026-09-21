import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConflictError,
  createCalcService,
  type Db,
  NotFoundError,
  type CalcService,
} from './calc.ts';
import { drizzle as drizzleSqlJs } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import { createDb } from '../server/db/client.ts';
import { applyMigrations } from './migrations.ts';
import * as schema from './schema.ts';

// The service must behave identically on the server (better-sqlite3) and in the
// app (sql.js with bundled migrations), so the whole suite runs against both.
const SQL = await initSqlJs();
const drivers: [string, () => Db][] = [
  ['better-sqlite3', () => createDb(':memory:')],
  [
    'sql.js',
    () => {
      const sqlite = new SQL.Database();
      sqlite.run('PRAGMA foreign_keys = ON');
      const db = drizzleSqlJs(sqlite, { schema });
      applyMigrations(db);
      return db;
    },
  ],
];

describe.each(drivers)('calc service (%s)', (_driver, makeDb) => {
  let calc: CalcService;
  let createDb: () => Db;

  beforeEach(() => {
    createDb = makeDb;
    calc = createCalcService(createDb());
  });

  it('calculates recipe and event prices with cascading updates', () => {
    calc.addIngredient('Rum', 20, true); // €/l
    calc.addIngredient('Cola', 2, false);
    calc.addRecipe('Cuba Libre', 'classic');
    calc.addIngredientAmount('Cuba Libre', 'Rum', 5); // cl
    const recipe = calc.addIngredientAmount('Cuba Libre', 'Cola', 15);

    // (5*20 + 15*2) / 100 = 1.30 €
    expect(recipe.price).toBeCloseTo(1.3);
    expect(recipe.alcohol).toBe(true);
    // creation order, not alphabetical
    expect(recipe.ingredients).toEqual([
      { name: 'Rum', amount: 5 },
      { name: 'Cola', amount: 15 },
    ]);

    calc.addEvent('Party');
    const event = calc.addEventRecipe('Party', 'Cuba Libre', 10);
    expect(event.price).toBeCloseTo(13);

    // buying list in litres: 10 * 5cl = 0.5l rum, 10 * 15cl = 1.5l cola
    expect(calc.getEventList('Party')).toEqual({
      ingredients: [
        { name: 'Cola', amount: 1.5 },
        { name: 'Rum', amount: 0.5 },
      ],
      price: 13,
    });

    // changing an ingredient price cascades to recipe and event
    calc.addIngredient('Rum', 40, true);
    expect(calc.findRecipe('Cuba Libre').price).toBeCloseTo(2.3);
    expect(calc.findEvent('Party').price).toBeCloseTo(23);

    // deleting the alcoholic ingredient removes alcohol flag and reduces prices
    calc.deleteIngredient('Rum');
    const after = calc.findRecipe('Cuba Libre');
    expect(after.ingredients).toEqual([{ name: 'Cola', amount: 15 }]);
    expect(after.price).toBeCloseTo(0.3);
    expect(after.alcohol).toBe(false);
    expect(calc.findEvent('Party').price).toBeCloseTo(3);

    // deleting a recipe cascades to events
    calc.deleteRecipe('Cuba Libre');
    expect(calc.findEvent('Party')).toEqual({
      name: 'Party',
      price: 0,
      recipes: [],
    });
    expect(calc.getRecipes()).toEqual([]);
  });

  it('upserts without duplicating', () => {
    calc.addRecipe('Mojito', '');
    calc.addRecipe('Mojito', 'minty');
    expect(calc.getRecipes()).toHaveLength(1);
    expect(calc.getRecipes()[0].description).toBe('minty');

    calc.addEvent('X');
    calc.addEvent('X');
    expect(calc.getEvents()).toHaveLength(1);
  });

  it('throws NotFoundError for unknown items', () => {
    expect(() => calc.findRecipe('nope')).toThrow(NotFoundError);
    expect(() => calc.findEvent('nope')).toThrow(NotFoundError);
    expect(() => calc.getEventList('nope')).toThrow(NotFoundError);
    expect(() => calc.deleteIngredient('nope')).toThrow(NotFoundError);
    expect(() => calc.deleteRecipe('nope')).toThrow(NotFoundError);
    expect(() => calc.deleteEvent('nope')).toThrow(NotFoundError);
  });

  it('rejects linking to unknown ingredients via foreign keys', () => {
    calc.addRecipe('R', '');
    expect(() => calc.addIngredientAmount('R', 'ghost', 1)).toThrow(
      /FOREIGN KEY/,
    );
  });

  it('exports and imports all data', () => {
    calc.addIngredient('Rum', 20, true);
    calc.addIngredient('Cola', 2, false);
    calc.addRecipe('Cuba Libre', 'classic');
    calc.addIngredientAmount('Cuba Libre', 'Rum', 5);
    calc.addIngredientAmount('Cuba Libre', 'Cola', 15);
    calc.addEvent('Party');
    calc.addEventRecipe('Party', 'Cuba Libre', 10);

    const dump = calc.exportAll();
    expect(dump.version).toBe(1);
    expect(dump.recipes).toEqual([
      {
        name: 'Cuba Libre',
        description: 'classic',
        ingredients: [
          { name: 'Rum', amount: 5 },
          { name: 'Cola', amount: 15 },
        ],
      },
    ]);
    expect(dump.events).toEqual([
      { name: 'Party', recipes: [{ name: 'Cuba Libre', amount: 10 }] },
    ]);

    // merge into a fresh db with conflicting data -> prices are recalculated
    const other = createCalcService(createDb());
    other.addIngredient('Rum', 999, true);
    other.addRecipe('Mojito', '');
    expect(other.importAll(dump)).toEqual({
      ingredients: 2,
      recipes: 1,
      events: 1,
    });
    expect(other.findRecipe('Cuba Libre').price).toBeCloseTo(1.3);
    expect(other.findEvent('Party').price).toBeCloseTo(13);
    expect(other.getRecipes().map((r) => r.name)).toEqual([
      'Cuba Libre',
      'Mojito',
    ]);

    // replace wipes everything first
    expect(other.importAll(dump, true).recipes).toBe(1);
    expect(other.getRecipes().map((r) => r.name)).toEqual(['Cuba Libre']);
    expect(other.getIngredients().find((i) => i.name === 'Rum')?.price).toBe(
      20,
    );
  });

  it('renames items and keeps references and prices', () => {
    calc.addIngredient('Rum', 20, true);
    calc.addRecipe('Cuba Libre', 'classic');
    calc.addIngredientAmount('Cuba Libre', 'Rum', 5);
    calc.addEvent('Party');
    calc.addEventRecipe('Party', 'Cuba Libre', 10);

    expect(calc.renameIngredient('Rum', 'Havana')).toEqual({
      name: 'Havana',
      price: 20,
      alcohol: true,
    });
    expect(calc.findRecipe('Cuba Libre').ingredients).toEqual([
      { name: 'Havana', amount: 5 },
    ]);

    const recipe = calc.renameRecipe('Cuba Libre', 'Havana Libre');
    expect(recipe.name).toBe('Havana Libre');
    expect(recipe.price).toBeCloseTo(1);
    expect(recipe.ingredients).toEqual([{ name: 'Havana', amount: 5 }]);
    expect(calc.findEvent('Party').recipes).toEqual([
      { name: 'Havana Libre', amount: 10 },
    ]);

    const event = calc.renameEvent('Party', 'Fest');
    expect(event).toEqual({
      name: 'Fest',
      price: 10,
      recipes: [{ name: 'Havana Libre', amount: 10 }],
    });
    expect(calc.getEvents()).toHaveLength(1);
    expect(calc.getEventList('Fest').ingredients).toEqual([
      { name: 'Havana', amount: 0.5 },
    ]);

    calc.addIngredient('Cola', 2, false);
    expect(() => calc.renameIngredient('Cola', 'Havana')).toThrow(
      ConflictError,
    );
    expect(() => calc.renameIngredient('Cola', 'Cola')).toThrow(ConflictError);
    expect(() => calc.renameRecipe('nope', 'x')).toThrow(NotFoundError);
    expect(calc.getIngredients().map((i) => i.name)).toEqual([
      'Cola',
      'Havana',
    ]);
  });

  it('orders by creation and allows reordering', () => {
    for (const n of ['A', 'B', 'C']) calc.addIngredient(n, 1, false);
    calc.addRecipe('R', '');
    for (const n of ['B', 'C', 'A']) calc.addIngredientAmount('R', n, 1);
    expect(calc.findRecipe('R').ingredients.map((i) => i.name)).toEqual([
      'B',
      'C',
      'A',
    ]);
    // updating an amount keeps the position
    calc.addIngredientAmount('R', 'B', 9);
    expect(calc.findRecipe('R').ingredients.map((i) => i.name)).toEqual([
      'B',
      'C',
      'A',
    ]);

    const reordered = calc.reorderRecipeIngredients('R', ['A', 'B', 'C']);
    expect(reordered.ingredients.map((i) => i.name)).toEqual(['A', 'B', 'C']);
    // new ingredients are appended
    calc.addIngredient('D', 1, false);
    calc.addIngredientAmount('R', 'D', 1);
    expect(calc.findRecipe('R').ingredients.map((i) => i.name)).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);

    calc.addRecipe('S', '');
    calc.addEvent('E');
    calc.addEventRecipe('E', 'S', 1);
    calc.addEventRecipe('E', 'R', 1);
    expect(calc.findEvent('E').recipes.map((r) => r.name)).toEqual(['S', 'R']);
    expect(
      calc.reorderEventRecipes('E', ['R', 'S']).recipes.map((r) => r.name),
    ).toEqual(['R', 'S']);

    // export keeps the order and import restores it
    const dump = calc.exportAll();
    const other = createCalcService(createDb());
    other.importAll(dump);
    expect(other.findRecipe('R').ingredients.map((i) => i.name)).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
    expect(other.findEvent('E').recipes.map((r) => r.name)).toEqual(['R', 'S']);
  });
});
