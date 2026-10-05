import { expect, it } from 'vitest';
import { newDemo } from '../src/demo';
import { expenseChoices } from '../src/expenseChoices';

it('selects a subcategory directly while retaining its parent and preserving old direct entries', () => {
  const ledger = newDemo();
  const choices = expenseChoices(ledger);
  const petrol = choices.find(c => c.label === 'Petrol')!;
  expect(petrol.categoryId).toBe(ledger.categories.find(c => c.name === 'Transport')!.id);
  expect(petrol.subcategoryId).not.toBeNull();
  expect(choices.some(c => c.label === 'Transport')).toBe(false);
  const historical = { ...ledger.entries[0], category_id: petrol.categoryId, subcategory_id: null };
  expect(expenseChoices(ledger, historical).some(c => c.categoryId === petrol.categoryId && c.subcategoryId === null)).toBe(true);
  ledger.subcategories = ledger.subcategories!.map(s => s.id === petrol.subcategoryId ? {...s, archived:true} : s);
  expect(expenseChoices(ledger).some(c => c.value === petrol.value)).toBe(false);
  expect(expenseChoices(ledger, {...historical,subcategory_id:petrol.subcategoryId}).some(c => c.value === petrol.value)).toBe(true);
});
