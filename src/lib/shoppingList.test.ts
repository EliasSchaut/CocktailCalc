import { expect, it } from 'vitest';
import { shoppingListMarkdown } from './shoppingList';

it('renders a markdown task list', () => {
  expect(
    shoppingListMarkdown('Party', 13, [
      { name: 'Cola', amount: 1.5 },
      { name: 'Rum', amount: 0.5 },
    ]),
  ).toBe(
    '# Einkaufsliste Party (13.00 €)\n\n- [ ] Cola 1.5 L\n- [ ] Rum 0.5 L\n',
  );
});
