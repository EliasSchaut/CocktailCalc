import { beforeEach, describe, expect, it } from 'vitest';
import { createCalcService, NotFoundError, type CalcService } from './calc.ts';
import { createDb } from './db/client.ts';

describe('calc service', () => {
  let calc: CalcService;

  beforeEach(() => {
    calc = createCalcService(createDb(':memory:'));
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
    expect(recipe.ingredients).toEqual([
      { name: 'Cola', amount: 15 },
      { name: 'Rum', amount: 5 },
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
});
