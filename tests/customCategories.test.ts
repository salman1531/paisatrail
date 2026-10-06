import { expect, it } from 'vitest';
import { newDemo } from '../src/demo';
import { namedCategory } from '../src/expenseChoices';

it('creates a reusable category only in the selected financial type and owner', () => {
  const ledger=newDemo();
  for (const kind of ['expense','income','saving','investment'] as const) {
    const planned=namedCategory(ledger,kind,'  My custom name  ','fixture-id');
    expect(planned.isNew).toBe(true);
    expect(planned.category).toMatchObject({id:'fixture-id',user_id:ledger.profile.user_id,name:'My custom name',kind,archived:false});
  }
});
it('reuses an active name without making a duplicate and keeps types separate', () => {
  const ledger=newDemo();const root=ledger.categories.find(c=>c.kind==='expense')!;
  expect(namedCategory(ledger,'expense',root.name.toUpperCase(),'unused').category.id).toBe(root.id);
  expect(namedCategory(ledger,'expense',root.name,'unused').isNew).toBe(false);
  expect(namedCategory(ledger,'income',root.name,'new-income').isNew).toBe(true);
  root.archived=true;
  expect(()=>namedCategory(ledger,'expense',root.name,'unused')).toThrow('archived');
});
it('rejects empty or overlength custom names before saving', () => {
  const ledger=newDemo();
  for (const name of ['', '   ', 'x'.repeat(61)]) expect(()=>namedCategory(ledger,'expense',name,'fixture-id')).toThrow('1 and 60');
});
