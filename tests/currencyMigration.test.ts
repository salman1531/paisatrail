import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
async function as(id:string,sql:string,args:unknown[]=[]){await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);try{return await db.query(sql,args);}finally{await db.exec('reset role');}}
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${a}'),('${b}');`);
 for(const name of ['001_initial','002_pkr_default','003_monthly_savings_goal','004_period_goals','005_expense_subcategories','006_default_expense_choices','007_more_subcategories'])await db.exec(readFileSync(new URL('../supabase/migrations/'+name+'.sql',import.meta.url),'utf8'));
 await as(a,'select initialize_ledger()');await as(a,'update profiles set income_target=18000000,spending_target=10000000,saving_target=3000000,emergency_target=54000000');
 await as(a,"select replace_period_goals('2026-10','PKR','[{\"kind\":\"expense\",\"target_minor\":11000000}]')");
 await db.exec(readFileSync(new URL('../supabase/migrations/009_currency_and_starters.sql',import.meta.url),'utf8'));
},60000);
afterAll(()=>db.close());
it('keeps legacy defaults, monthly plans and categories intact when changing the entry default',async()=>{
 const before=(await as(a,'select * from categories')).rows;await as(a,"update profiles set currency='USD'");const profile=(await as(a,'select * from profiles')).rows[0];expect(profile.planning_currency).toBe('PKR');expect(profile.income_target).toBe(18000000);expect(profile.emergency_target).toBe(54000000);expect((await as(a,'select * from categories')).rows).toEqual(before);expect((await as(a,'select target_minor from period_goals')).rows[0].target_minor).toBe(11000000);
 await expect(as(a,"update profiles set planning_currency='USD'")).rejects.toThrow('keep their currency');await expect(as(b,'select * from profiles where user_id=$1',[a])).resolves.toMatchObject({rows:[]});await expect(as(a,'update profiles set user_id=$1',[b])).rejects.toThrow();
});
it('seeds a single deliberate hierarchy for new accounts only, once',async()=>{
 await as(b,'select initialize_ledger()');const cats=(await as(b,'select * from categories')).rows;expect(cats).toHaveLength(11);expect(cats.some(c=>c.name==='Expenses')).toBe(false);
 const food=cats.find(c=>c.name==='Food')!;const names=(await as(b,'select name from subcategories where category_id=$1 order by name',[food.id])).rows.map(r=>r.name);expect(names).toEqual(['Coffee','Dining','Groceries']);await as(b,'select initialize_ledger()');expect((await as(b,'select * from categories')).rows).toHaveLength(11);expect((await as(a,'select * from categories')).rows).toHaveLength(4);
 await db.exec('set role anon');await expect(db.query('select initialize_ledger()')).rejects.toThrow();await db.exec('reset role');
});
