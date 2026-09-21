import { z } from 'zod';

const name = z.string().trim().min(1).max(40);

export const NameBody = z.object({ name });

export const RenameBody = z.object({ name, newName: name });

export const IngredientBody = z.object({
  name,
  price: z.number().min(0).max(1_000_000),
  alcohol: z.boolean().optional().default(false),
});

export const RecipeBody = z.object({
  name,
  description: z.string().max(1000).optional().default(''),
});

export const RecipeIngredientBody = z.object({
  recipe: name,
  ingredient: name,
  amount: z.number().min(0).max(10_000),
});

export const DeleteRecipeIngredientBody = z.object({
  recipe: name,
  ingredient: name,
});

export const EventRecipeBody = z.object({
  event: name,
  recipe: name,
  amount: z.number().int().min(0).max(10_000),
});

export const DeleteEventRecipeBody = z.object({ event: name, recipe: name });

const withAmount = z.object({ name, amount: z.number().min(0).max(10_000) });

export const DataExportBody = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  ingredients: z.array(
    z.object({
      name,
      price: z.number().min(0).max(1_000_000),
      alcohol: z.boolean(),
    }),
  ),
  recipes: z.array(
    z.object({
      name,
      description: z.string().max(1000).nullable().default(null),
      ingredients: z.array(withAmount),
    }),
  ),
  events: z.array(
    z.object({
      name,
      recipes: z.array(
        withAmount.extend({ amount: z.number().int().min(0).max(10_000) }),
      ),
    }),
  ),
});

export const RecipeOrderBody = z.object({
  recipe: name,
  order: z.array(name).max(500),
});
export const EventOrderBody = z.object({
  event: name,
  order: z.array(name).max(500),
});
