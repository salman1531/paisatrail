import type { Category, Entry, Ledger, Kind } from './types';

export const customCategoryChoice = '__custom_category__';
export function namedCategory(ledger: Ledger, kind: Kind, value: string, id: string) {
  const name = value.trim();
  if (!name || name.length > 60) throw new Error('Enter a category name between 1 and 60 characters.');
  const existing = ledger.categories.find(c => c.kind === kind && c.name.toLowerCase() === name.toLowerCase());
  if (existing?.archived) throw new Error('This category is archived. Restore it in Categories or choose another name.');
  const category: Category = existing ?? {id, user_id: ledger.profile.user_id, name, kind, archived:false, essential:false, emergency:false};
  return {category, isNew:!existing};
}

export function categoryChoices(ledger: Ledger, kind: Kind, existing?: Entry | null) {
  const choices: { value: string; label: string; categoryId: string; subcategoryId: string | null }[] = [];
  for (const category of ledger.categories.filter(c => c.kind === kind && (!c.archived || c.id === existing?.category_id))) {
    const children = (ledger.subcategories ?? []).filter(s => s.category_id === category.id && ((!s.archived && !category.archived) || s.id === existing?.subcategory_id));
    if ((!category.archived && !children.length) || (existing?.category_id === category.id && !existing.subcategory_id)) {
      choices.push({ value: category.id, label: category.name + (category.archived ? ' (archived)' : children.length ? ' (no subcategory)' : ''), categoryId: category.id, subcategoryId: null });
    }
    for (const child of children) choices.push({ value: child.id, label: child.name + (child.archived || category.archived ? ' (archived)' : ''), categoryId: category.id, subcategoryId: child.id });
  }
  // Only duplicate names need parent context to prevent choosing the wrong record.
  return choices.map(choice => choices.filter(other => other.label === choice.label).length > 1 ? { ...choice, label: `${choice.label} · ${ledger.categories.find(c => c.id === choice.categoryId)!.name}` } : choice);
}

export function expenseChoices(ledger: Ledger, existing?: Entry | null) { return categoryChoices(ledger, 'expense', existing); }
