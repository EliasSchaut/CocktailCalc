import { z } from 'zod';

const name = z.string().trim().min(1).max(40);

export const NameBody = z.object({ name });

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
