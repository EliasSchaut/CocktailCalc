import type { IngredientWithAmount } from './types';

/** Formats an event's buying list as a Markdown task list. */
export function shoppingListMarkdown(
  event: string,
  price: number,
  ingredients: IngredientWithAmount[],
): string {
  const lines = [`# Einkaufsliste ${event} (${price.toFixed(2)} €)`, ''];
  for (const i of ingredients)
    lines.push(`- [ ] ${i.name} ${i.amount.toFixed(1)} L`);
  return lines.join('\n') + '\n';
}
