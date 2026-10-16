import {afterEach,describe,it,expect,vi} from 'vitest';
import {newDemo,readDemo} from '../src/demo';
import {currencies} from '../src/types';
afterEach(()=>vi.unstubAllGlobals());
describe('fresh demo clarity and saved choices',()=>{
 it('links only emergency contributions to the emergency goal in every currency scenario',()=>{
  for(const currency of currencies){const ledger=newDemo(currency),linked=ledger.entries.filter(entry=>entry.named_goal_id);expect(linked.length).toBeGreaterThan(0);
   for(const entry of linked){expect(ledger.namedGoals!.find(goal=>goal.id===entry.named_goal_id)!.name).toBe('Emergency cushion');expect(ledger.subcategories!.find(child=>child.id===entry.subcategory_id)!.name).toBe('Emergency fund');expect(entry.notes).toBe('Monthly safety cushion');}
   expect(ledger.entries.filter(entry=>entry.notes==='Holiday savings').every(entry=>!entry.named_goal_id)).toBe(true);
  }
 });
 it('keeps an existing currency choice and demo edits when reopening',()=>{
  const saved=newDemo('USD');saved.entries[0].notes='My local example';const value=JSON.stringify(saved);vi.stubGlobal('localStorage',{getItem:()=>value,setItem:()=>{}});
  const reopened=readDemo();expect(reopened.profile.currency).toBe('USD');expect(reopened.entries).toEqual(saved.entries);
 });
});
