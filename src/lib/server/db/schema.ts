import { relations } from 'drizzle-orm';
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

// Prices: ingredients in €/l, recipes and events in € (denormalised, kept in sync by calc.ts).
// Amounts: recipe ingredients in cl, event recipes as a count.

export const ingredients = sqliteTable('ingredients', {
  name: text('name').primaryKey(),
  price: real('price').notNull().default(0),
  alcohol: integer('alcohol', { mode: 'boolean' }).notNull().default(false),
});

export const recipes = sqliteTable('recipes', {
  name: text('name').primaryKey(),
  description: text('description'),
  price: real('price').notNull().default(0),
  alcohol: integer('alcohol', { mode: 'boolean' }).notNull().default(false),
});

export const recipeIngredients = sqliteTable(
  'recipe_ingredients',
  {
    recipeName: text('recipe_name')
      .notNull()
      .references(() => recipes.name, { onDelete: 'cascade' }),
    ingredientName: text('ingredient_name')
      .notNull()
      .references(() => ingredients.name, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
  },
  (t) => [primaryKey({ columns: [t.recipeName, t.ingredientName] })],
);

export const events = sqliteTable('events', {
  name: text('name').primaryKey(),
  price: real('price').notNull().default(0),
});

export const eventRecipes = sqliteTable(
  'event_recipes',
  {
    eventName: text('event_name')
      .notNull()
      .references(() => events.name, { onDelete: 'cascade' }),
    recipeName: text('recipe_name')
      .notNull()
      .references(() => recipes.name, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventName, t.recipeName] })],
);

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  eventRecipes: many(eventRecipes),
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeName],
      references: [recipes.name],
    }),
    ingredient: one(ingredients, {
      fields: [recipeIngredients.ingredientName],
      references: [ingredients.name],
    }),
  }),
);

export const eventsRelations = relations(events, ({ many }) => ({
  recipes: many(eventRecipes),
}));

export const eventRecipesRelations = relations(eventRecipes, ({ one }) => ({
  event: one(events, {
    fields: [eventRecipes.eventName],
    references: [events.name],
  }),
  recipe: one(recipes, {
    fields: [eventRecipes.recipeName],
    references: [recipes.name],
  }),
}));
