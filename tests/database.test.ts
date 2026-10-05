import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
const db = new PGlite();
const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002';
let aCat = '', bCat = '';
async function asUser(id: string, query: string, params: unknown[] = []) { await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false);`); try { return await db.query(query, params); } finally { await db.exec('reset role'); } }
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$; grant usage on schema auth, public to authenticated, anon; grant execute on function auth.uid() to authenticated; insert into auth.users values ('${a}'), ('${b}');`);
  await db.exec(readFileSync(new URL('../supabase/migrations/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/002_pkr_default.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/003_monthly_savings_goal.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/004_period_goals.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/005_expense_subcategories.sql', import.meta.url), 'utf8'));
  await asUser(a, "select public.initialize_ledger('Asia/Karachi')"); await asUser(b, "select public.initialize_ledger('UTC')");
  aCat = String((await asUser(a, "select id from categories where kind='expense'")).rows[0].id); bCat = String((await asUser(b, "select id from categories where kind='expense'")).rows[0].id);
  await asUser(b, "insert into entries(user_id, category_id, date, amount_minor, currency) values ($1,$2,'2026-01-01',100,'USD')", [b, bCat]);
}, 60000);
afterAll(async () => { await db.close(); });
describe('database authorization and invariants', () => {
  it('defaults new accounts to PKR', async () => { expect((await asUser(a, 'select currency from profiles')).rows[0].currency).toBe('PKR'); });
  it('returns only the authenticated user records, including the export source query', async () => { expect((await asUser(a, 'select * from categories')).rows).toHaveLength(4); expect((await asUser(a, 'select * from entries')).rows).toHaveLength(0); expect((await asUser(a, 'select * from profiles where user_id=$1', [b])).rows).toHaveLength(0); });
  it('prevents reading, updating and deleting another user entries', async () => { expect((await asUser(a, 'update entries set amount_minor=999 where user_id=$1 returning id', [b])).rows).toHaveLength(0); expect((await asUser(a, 'delete from entries where user_id=$1 returning id', [b])).rows).toHaveLength(0); expect((await asUser(b, 'select amount_minor from entries')).rows[0].amount_minor).toBe(100); });
  it('rejects forged ownership and cross-user category references', async () => { await expect(asUser(a, "insert into entries(user_id,category_id,date,amount_minor,currency) values ($1,$2,'2026-01-01',100,'USD')", [b, bCat])).rejects.toThrow(); await expect(asUser(a, "insert into entries(user_id,category_id,date,amount_minor,currency) values ($1,$2,'2026-01-01',100,'USD')", [a, bCat])).rejects.toThrow(); await expect(asUser(a, "insert into categories(user_id,name,kind) values ($1,'Forged','expense')", [b])).rejects.toThrow(); });
  it('rejects anonymous access and initialization', async () => { await db.exec('set role anon'); await expect(db.query('select * from entries')).rejects.toThrow(); await expect(db.query('select initialize_ledger()')).rejects.toThrow(); await db.exec('reset role'); });
  it('seeds once, even if defaults are removed', async () => { await asUser(a, "delete from categories where kind='income'"); await asUser(a, 'select initialize_ledger()'); expect((await asUser(a, 'select * from categories')).rows).toHaveLength(3); });
  it('preserves entries when categories are archived or renamed', async () => { await asUser(b, 'update categories set name=$1, archived=true where id=$2', ['Household', bCat]); expect((await asUser(b, 'select * from entries')).rows).toHaveLength(1); await expect(asUser(b, 'delete from categories where id=$1', [bCat])).rejects.toThrow(); await expect(asUser(b, "insert into entries(user_id,category_id,date,amount_minor,currency) values ($1,$2,'2026-01-02',100,'USD')", [b,bCat])).rejects.toThrow(); await asUser(b, 'update entries set notes=$1', ['History stays editable']); });
  it('rejects category type changes and expense withdrawals', async () => { await expect(asUser(a, "update categories set kind='saving' where id=$1", [aCat])).rejects.toThrow(); await expect(asUser(a, "insert into entries(user_id,category_id,date,amount_minor,currency,withdrawal) values ($1,$2,'2026-01-02',100,'USD',true)", [a,aCat])).rejects.toThrow(); });
  it('validates money, planning targets and timezone at the server boundary', async () => { await expect(asUser(a, "insert into entries(user_id,category_id,date,amount_minor,currency) values ($1,$2,'2026-01-02',0,'USD')", [a,aCat])).rejects.toThrow(); await expect(asUser(a, "update profiles set timezone='not/a/timezone'")).rejects.toThrow(); await expect(asUser(a, 'update profiles set spending_target=-1')).rejects.toThrow(); });
  it('preserves separate entries on the same date, even with identical category and amount', async () => { await asUser(a, "insert into entries(user_id,category_id,date,amount_minor,currency) values ($1,$2,'2026-02-03',125,'PKR'), ($1,$2,'2026-02-03',125,'PKR')", [a,aCat]); const rows = (await asUser(a, "select id,amount_minor from entries where date='2026-02-03'")).rows; expect(rows).toHaveLength(2); expect(new Set(rows.map(r => r.id)).size).toBe(2); expect(rows.reduce((sum, row) => sum + Number(row.amount_minor), 0)).toBe(250); });
  it('keeps emergency contributions within total savings and validates new goal fields', async () => { await expect(asUser(a, 'update profiles set saving_target=-1')).rejects.toThrow(); await expect(asUser(a, 'update profiles set saving_target=100, emergency_contribution=200')).rejects.toThrow(); await asUser(a, 'update profiles set saving_target=500, emergency_contribution=200'); await expect(asUser(a, "update profiles set currency='USD'")).rejects.toThrow(); expect((await asUser(a, 'select saving_target from profiles')).rows[0].saving_target).toBe(500); });
});

describe('period goal authorization', () => {
  it('isolates reads and edits and blocks forged owners, categories and anonymous access', async () => {
    await asUser(b, "select replace_period_goals('2026','PKR',$1::jsonb)", [JSON.stringify([{kind:'income',target_minor:1200,category_id:null}])]);
    expect((await asUser(a, 'select * from period_goals where user_id=$1',[b])).rows).toHaveLength(0);
    expect((await asUser(a, 'delete from period_goals where user_id=$1 returning id',[b])).rows).toHaveLength(0);
    expect((await asUser(a, 'update period_goals set target_minor=0 where user_id=$1 returning id',[b])).rows).toHaveLength(0);
    await expect(asUser(a, "insert into period_goals(user_id,period,currency,kind,target_minor) values ($1,'2026','PKR','income',1)",[b])).rejects.toThrow();
    await expect(asUser(a, "select replace_period_goals('2026-01','PKR',$1::jsonb)",[JSON.stringify([{kind:'expense',category_id:bCat,target_minor:100}])])).rejects.toThrow();
    await db.exec('set role anon'); await expect(db.query('select * from period_goals')).rejects.toThrow(); await expect(db.query("select replace_period_goals('2026','PKR','[]'::jsonb)")).rejects.toThrow(); await db.exec('reset role');
  });
  it('validates goal limits and rolls back invalid replacements without losing existing goals', async () => {
    await asUser(a,"select replace_period_goals('2026-01','PKR',$1::jsonb)",[JSON.stringify([{kind:'expense',category_id:aCat,target_minor:0},{kind:'income',target_minor:1000}])]);
    for (const target of [-1,1000000000001]) await expect(asUser(a,"select replace_period_goals('2026-01','PKR',$1::jsonb)",[JSON.stringify([{kind:'income',target_minor:target}])])).rejects.toThrow();
    await expect(asUser(a,"select replace_period_goals('2026-13','PKR','[]'::jsonb)")).rejects.toThrow();
    await expect(asUser(a,"select replace_period_goals('2026-01','PKR',$1::jsonb)",[JSON.stringify([{kind:'income',target_minor:1},{kind:'income',target_minor:2}])])).rejects.toThrow();
    expect((await asUser(a,"select * from period_goals where period='2026-01'")).rows).toHaveLength(2);
    await asUser(a,"select replace_period_goals('2026','PKR',$1::jsonb)",[JSON.stringify([{kind:'income',target_minor:12000}])]);
    await asUser(a,"select replace_period_goals('2026-01','PKR','[]'::jsonb)");
    expect((await asUser(a,"select target_minor from period_goals where period='2026'")).rows[0].target_minor).toBe(12000);
  });
});

describe('expense subcategories', () => {
  it('keeps subcategories private and tied to their parent category', async () => {
    const row = await asUser(a, "insert into subcategories(user_id,category_id,name) values ($1,$2,'Bills') returning id", [a,aCat]);
    const subId = String(row.rows[0].id);
    const other = String((await asUser(a, "insert into categories(user_id,name,kind) values ($1,'Transport','expense') returning id", [a])).rows[0].id);
    await expect(asUser(a, "insert into entries(user_id,category_id,subcategory_id,date,amount_minor,currency) values ($1,$2,$3,'2026-03-01',100,'PKR')", [a,other,subId])).rejects.toThrow();
    const saving = String((await asUser(a, "select id from categories where kind='saving'")).rows[0].id);
    await expect(asUser(a, "insert into subcategories(user_id,category_id,name) values ($1,$2,'Invalid')", [a,saving])).rejects.toThrow();
    expect((await asUser(b, 'select * from subcategories')).rows).toHaveLength(0);
    await expect(asUser(b, "insert into subcategories(user_id,category_id,name) values ($1,$2,'Forged')", [b,aCat])).rejects.toThrow();
    await expect(asUser(a, "insert into entries(user_id,category_id,subcategory_id,date,amount_minor,currency) values ($1,$2,$3,'2026-03-01',100,'PKR')", [a,bCat,subId])).rejects.toThrow();
    await asUser(a, "insert into entries(user_id,category_id,subcategory_id,date,amount_minor,currency) values ($1,$2,$3,'2026-03-01',100,'PKR')", [a,aCat,subId]);
    await asUser(a, 'update subcategories set archived=true where id=$1', [subId]);
    await expect(asUser(a, "insert into entries(user_id,category_id,subcategory_id,date,amount_minor,currency) values ($1,$2,$3,'2026-03-02',100,'PKR')", [a,aCat,subId])).rejects.toThrow();
    expect((await asUser(a, 'select subcategory_id from entries where subcategory_id=$1', [subId])).rows).toHaveLength(1);
    await expect(asUser(a, 'delete from subcategories where id=$1', [subId])).rejects.toThrow();
  });
});
