import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
const db=new PGlite(),admin='00000000-0000-4000-8000-000000000001',user='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',session='00000000-0000-4000-8000-000000000099';
async function as(id:string,sql:string,args:unknown[]=[]){await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);try{return await db.query(sql,args);}finally{await db.exec('reset role');}}
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,created_at timestamptz default now(),email_confirmed_at timestamptz,last_sign_in_at timestamptz);create table auth.sessions(id uuid primary key,user_id uuid references auth.users on delete cascade,not_after timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id','${session}')$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;insert into auth.users(id,email,email_confirmed_at,last_sign_in_at) values('${admin}','admin@example.com',now(),now()),('${user}','person@example.com',now(),now()),('${other}','other@example.com',now(),now());insert into auth.sessions values('${session}','${admin}',null);`);
 for(const name of ['001_initial','002_pkr_default','003_monthly_savings_goal','004_period_goals','005_expense_subcategories','006_default_expense_choices','007_more_subcategories','008_admin'])await db.exec(readFileSync(new URL('../supabase/migrations/'+name+'.sql',import.meta.url),'utf8'));
 await db.query('insert into paisatrace_private.admins values($1)',[admin]);
 for(const id of [admin,user,other])await as(id,'select initialize_ledger()');
},60000);
afterAll(()=>db.close());
it('denies anonymous and non-admin account access and privilege escalation',async()=>{
 expect((await as(user,'select is_paisatrace_admin() as allowed')).rows[0].allowed).toBe(false);
 await expect(as(user,'select paisatrace_admin_overview()')).rejects.toThrow('Admin access required');
 await expect(as(user,'insert into paisatrace_private.admins values($1)',[user])).rejects.toThrow();
 await expect(as(user,'select * from paisatrace_private.activity')).rejects.toThrow();
 await expect(as(user,'select paisatrace_admin_delete_user($1,$2)',[other,'other@example.com'])).rejects.toThrow('Admin access required');
 await db.exec('set role anon');await expect(db.query('select paisatrace_admin_overview()')).rejects.toThrow();await db.exec('reset role');
});
it('returns only account metadata, bounds filters and tracks authenticated activity',async()=>{
 await as(user,'select record_paisatrace_activity()');await as(user,'select record_paisatrace_activity()');
 expect((await db.query('select * from paisatrace_private.activity')).rows).toHaveLength(1);
 const row=(await as(admin,'select paisatrace_admin_overview($1,0) as value',['person@'])).rows[0].value as {total:number;active_7d:number;users:Record<string,unknown>[]};
 expect(row.total).toBe(3);expect(row.active_7d).toBe(1);expect(row.users).toHaveLength(1);
 expect(Object.keys(row.users[0]).sort()).toEqual(['id','email','created_at','email_confirmed_at','last_sign_in_at','last_active_at','is_admin'].sort());
 await expect(as(admin,"select paisatrace_admin_overview('',-1)")).rejects.toThrow('Invalid filter');
});
it('requires active admin session, recent sign-in and exact target confirmation',async()=>{
 await db.exec("update auth.sessions set not_after=now()-interval '1 second'");await expect(as(admin,'select paisatrace_admin_overview()')).rejects.toThrow('Admin access required');await db.exec('update auth.sessions set not_after=null');
 await expect(as(admin,'select paisatrace_admin_delete_user($1,$2)',[admin,'admin@example.com'])).rejects.toThrow('Admin accounts');
 await expect(as(admin,'select paisatrace_admin_delete_user($1,$2)',[user,'wrong@example.com'])).rejects.toThrow('exact account email');
 await db.query("update auth.users set last_sign_in_at=now()-interval '1 hour' where id=$1",[admin]);await expect(as(admin,'select paisatrace_admin_delete_user($1,$2)',[user,'person@example.com'])).rejects.toThrow('sign in again');await db.query('update auth.users set last_sign_in_at=now() where id=$1',[admin]);
});
it('atomically deletes account and dependent finance records, preserving admin and audit',async()=>{
 const cat=(await as(user,"select id from categories where kind='expense'")).rows[0].id;
 await as(user,"insert into entries(user_id,category_id,date,amount_minor,currency) values($1,$2,'2026-10-06',100,'PKR')",[user,cat]);await as(user,"select replace_period_goals('2026-10','PKR','[{\"kind\":\"income\",\"target_minor\":100}]')");
 await as(admin,'select paisatrace_admin_delete_user($1,$2)',[user,'person@example.com']);
 for(const table of ['auth.users','public.profiles','public.categories','public.entries','public.period_goals','public.subcategories','paisatrace_private.activity'])expect((await db.query(`select count(*)::int as count from ${table} where ${table==='auth.users'?'id':'user_id'}=$1`,[user])).rows[0].count).toBe(0);
 expect((await db.query('select * from paisatrace_private.admin_audit')).rows).toHaveLength(1);
 await expect(as(user,'select initialize_ledger()')).rejects.toThrow();await expect(as(user,'select record_paisatrace_activity()')).rejects.toThrow('Sign in required');
 expect((await as(admin,'select is_paisatrace_admin() as value')).rows[0].value).toBe(true);
});
