import type { Entry, Ledger } from './types';

export function expenseChoices(ledger: Ledger, existing?: Entry | null) {
  const choices: { value: string; label: string; categoryId: string; subcategoryId: string | null }[] = [];
  for (const category of ledger.categories.filter(c => c.kind === 'expense' && (!c.archived || c.id === existing?.category_id))) {
    const children = (ledger.subcategories ?? []).filter(s => s.category_id === category.id && ((!s.archived && !category.archived) || s.id === existing?.subcategory_id));
    if ((!category.archived && !children.length) || (existing?.category_id === category.id && !existing.subcategory_id)) {
      choices.push({ value: category.id, label: category.name + (category.archived ? ' (archived)' : children.length ? ' (no subcategory)' : ''), categoryId: category.id, subcategoryId: null });
    }
    for (const child of children) choices.push({ value: child.id, label: child.name + (child.archived || category.archived ? ' (archived)' : ''), categoryId: category.id, subcategoryId: child.id });
  }
  // Only duplicate names need parent context to prevent choosing the wrong record.
  return choices.map(choice => choices.filter(other => other.label === choice.label).length > 1 ? { ...choice, label: `${choice.label} · ${ledger.categories.find(c => c.id === choice.categoryId)!.name}` } : choice);
}
