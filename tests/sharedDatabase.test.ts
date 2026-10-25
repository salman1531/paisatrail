import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,it,expect} from 'vitest';
import {allocate} from '../src/shared/model';
const db=new PGlite(),a=crypto.randomUUID(),b=crypto.randomUUID(),outsider=crypto.randomUUID();const cid=crypto.randomUUID(),pa=crypto.randomUUID(),pb=crypto.randomUUID(),manual=crypto.randomUUID();let expense='',settlement='';
async function as(id:string,sql:string,args:unknown[]=[]){await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);try{return await db.query(sql,args);}finally{await db.exec('reset role');}}
async function cmd(user:string,action:string,data:Record<string,unknown>,context:string|null=cid,key=crypto.randomUUID()){const r=await as(user,'select shared_mutate($1,$2,$3,$4) result',[key,action,context,data]);return r.rows[0].result as Record<string,unknown>;}
beforeAll(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${a}'),('${b}'),('${outsider}');`);
 // Only a profiles stub is needed: proves shared-only use has no Personal Finance initializer dependency.
 await db.exec('create table profiles(user_id uuid primary key)');await db.exec(readFileSync(new URL('../supabase/migrations/018_shared_expenses.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('../supabase/migrations/019_shared_reporting.sql',import.meta.url),'utf8'));
 for(const [id,name] of [[a,'Ali'],[b,'Ahmed'],[outsider,'Other']])await as(id,"select shared_preferences(null,true,'shared',$1)",[name]);
 await cmd(a,'create_context',{id:cid,participant_id:pa,name:'Trip',kind:'group'} ,null);
 const token='a'.repeat(64);await cmd(a,'invite',{id:crypto.randomUUID(),token_hash:token});await cmd(b,'join',{hash:token,participant_id:pb},null);
},60000);
afterAll(()=>db.close());
it('supports shared-only onboarding without creating a personal profile',async()=>{expect((await db.query('select * from profiles')).rows).toHaveLength(0);const r=(await as(a,'select * from product_preferences')).rows;expect(r).toHaveLength(1);expect(r[0].personal_enabled).toBe(false);expect((await as(outsider,'select * from shared_contexts')).rows).toHaveLength(0);});
it('requires explicit join, unique membership and owner invitations',async()=>{await cmd(b,'join',{hash:'a'.repeat(64),participant_id:crypto.randomUUID()},null);expect((await as(a,'select * from shared_memberships')).rows).toHaveLength(2);await expect(cmd(b,'invite',{id:crypto.randomUUID(),token_hash:'b'.repeat(64)})).rejects.toThrow(/owner/);await expect(cmd(outsider,'add_participant',{id:crypto.randomUUID(),name:'Attack'})).rejects.toThrow();const preview=(await as(outsider,'select shared_invite_preview($1) r',['a'.repeat(64)])).rows[0].r as object;expect(Object.keys(preview)).not.toContain('participants');expect((await as(outsider,'select * from shared_expenses')).rows).toHaveLength(0);});
it('saves exact deterministic splits atomically, with immutable retry receipts',async()=>{
 expense=crypto.randomUUID();const key=crypto.randomUUID();const payload={id:expense,version:0,title:'Lunch',amount_minor:10001,date:'2026-10-22',payer_id:pa,split_method:'equal',shares:[{participant_id:pb},{participant_id:pa}]};
 await cmd(a,'expense',payload,cid,key);await cmd(a,'expense',payload,cid,key);await expect(cmd(a,'expense',{...payload,title:'Different'},cid,key)).rejects.toThrow(/different/);
 const rows=(await as(a,'select participant_id,amount_minor,weight from shared_expense_shares where expense_id=$1 order by participant_id',[expense])).rows;expect(rows).toEqual(allocate(10001,'equal',[{participant_id:pb},{participant_id:pa}]));
 expect((await as(a,'select * from shared_expenses')).rows).toHaveLength(1);
 await expect(cmd(b,'expense',{...payload,version:1,confirm_change:true})).rejects.toThrow(/recorder|owner/);
 await expect(cmd(a,'expense',{...payload,id:crypto.randomUUID(),split_method:'exact',shares:[{participant_id:pb,amount_minor:99}]})).rejects.toThrow(/equal/);
 expect((await as(a,'select * from shared_expenses')).rows).toHaveLength(1);
});
it('percentage and exact contract agrees with server, including an excluded payer',async()=>{
 for(const [method,values,total] of [['percentage',[3333,6667],101],['exact',[47,54],101]] as const){const id=crypto.randomUUID();await cmd(a,'expense',{id,version:0,title:'Split',amount_minor:total,date:'2026-10-22',payer_id:pa,split_method:method,shares:[{participant_id:pa,weight:values[0],amount_minor:values[0]},{participant_id:pb,weight:values[1],amount_minor:values[1]}]});const rows=(await as(a,'select participant_id,amount_minor from shared_expense_shares where expense_id=$1 order by participant_id',[id])).rows;expect(rows).toEqual(allocate(total,method,[{participant_id:pa,value:values[0]},{participant_id:pb,value:values[1]}]).map(({weight:_,...r})=>r));}
 await expect(cmd(a,'expense',{id:crypto.randomUUID(),version:0,title:'Invalid',amount_minor:100,date:'2026-10-22',payer_id:pa,split_method:'percentage',shares:[{participant_id:pb,weight:9999}]})).rejects.toThrow(/100%/);
});
it('pending repayments do not reduce debt; only receiver confirms, once',async()=>{
 const debt=Number((await as(a,'select amount_minor from shared_pairs($1) where debtor_id=$2 and creditor_id=$3',[cid,pb,pa])).rows[0].amount_minor);settlement=crypto.randomUUID();const d={id:settlement,payer_id:pb,receiver_id:pa,amount_minor:100,date:'2026-10-22',method:'Cash'};await cmd(b,'settlement',d);expect(Number((await as(a,'select amount_minor from shared_pairs($1) where debtor_id=$2',[cid,pb])).rows[0].amount_minor)).toBe(debt);
 await expect(cmd(b,'confirm_settlement',{id:settlement,version:1})).rejects.toThrow(/receiver/);const key=crypto.randomUUID();await cmd(a,'confirm_settlement',{id:settlement,version:1},cid,key);await cmd(a,'confirm_settlement',{id:settlement,version:1},cid,key);expect(Number((await as(a,'select amount_minor from shared_pairs($1) where debtor_id=$2',[cid,pb])).rows[0].amount_minor)).toBe(debt-100);
 await expect(cmd(a,'settlement',{...d,id:crypto.randomUUID(),amount_minor:debt})).rejects.toThrow(/exceeds/);
 await expect(cmd(a,'cancel_expense',{id:expense,version:1})).rejects.toThrow(/repayments/);
 await cmd(b,'cancel_settlement',{id:settlement,version:2});expect(Number((await as(a,'select amount_minor from shared_pairs($1) where debtor_id=$2',[cid,pb])).rows[0].amount_minor)).toBe(debt);
});
it('cancel, restore and version checks preserve the audit trail',async()=>{await cmd(a,'cancel_expense',{id:expense,version:1});await expect(cmd(a,'restore_expense',{id:expense,version:1})).rejects.toThrow(/changed/);await cmd(a,'restore_expense',{id:expense,version:2});expect((await as(a,'select * from shared_activity where entity_id=$1',[expense])).rows.length).toBe(3);await expect(as(a,"update shared_activity set action='Hidden'")).rejects.toThrow();await expect(as(a,'delete from shared_expenses')).rejects.toThrow();});
it('manual participants gain no access and claiming history needs owner link plus explicit acceptance',async()=>{
 await cmd(a,'add_participant',{id:manual,name:'Guest'});const hash='c'.repeat(64);await cmd(a,'invite',{id:crypto.randomUUID(),token_hash:hash,claim_participant_id:manual});await expect(cmd(outsider,'join',{hash,participant_id:crypto.randomUUID()},null)).rejects.toThrow(/Confirm/);await cmd(outsider,'join',{hash,confirm_claim:true},null);expect((await as(outsider,'select * from shared_participants where id=$1',[manual])).rows[0].user_id).toBe(outsider);
 await expect(cmd(a,'remove_member',{participant_id:pb})).rejects.toThrow(/outstanding/);
});
it('revocation/expiration and unrelated context authorization hold',async()=>{const id=crypto.randomUUID(),hash='d'.repeat(64);await cmd(a,'invite',{id,token_hash:hash});await cmd(a,'revoke_invite',{id});expect((await as(b,'select shared_invite_preview($1) r',[hash])).rows[0].r).toHaveProperty('error');const foreign=crypto.randomUUID();await cmd(outsider,'create_context',{id:foreign,participant_id:crypto.randomUUID(),kind:'direct',name:'Private friend',friend_id:crypto.randomUUID(),friend_name:'Manual'},null);await expect(cmd(a,'add_participant',{id:crypto.randomUUID(),name:'X'},foreign)).rejects.toThrow();expect((await as(a,'select * from shared_contexts where id=$1',[foreign])).rows).toHaveLength(0);await db.exec('set role anon');await expect(db.query('select * from shared_expenses')).rejects.toThrow();await db.exec('reset role');});
it('keeps a legacy personal user in Personal Finance without enabling Shared Expenses',async()=>{
 const legacy=crypto.randomUUID();await db.query('insert into auth.users values($1)',[legacy]);await db.query('insert into profiles values($1)',[legacy]);const p=(await as(legacy,'select shared_preferences() p')).rows[0].p as any;expect(p.personal_enabled).toBe(true);expect(p.shared_enabled).toBe(false);await expect(cmd(legacy,'create_context',{id:crypto.randomUUID(),participant_id:crypto.randomUUID(),name:'No permission'},null)).rejects.toThrow(/Enable/);
});
it('supports secure consent for direct friends and refuses a third participant',async()=>{
 const owner=crypto.randomUUID(),other=crypto.randomUUID(),third=crypto.randomUUID(),id=crypto.randomUUID(),mine=crypto.randomUUID(),guest=crypto.randomUUID();for(const u of [owner,other,third]){await db.query('insert into auth.users values($1)',[u]);await as(u,"select shared_preferences(null,true,'shared','Friend')");}
 await cmd(owner,'create_context',{id,participant_id:mine,kind:'direct',name:'Direct costs',friend_id:guest,friend_name:'Guest'},null);
 await cmd(owner,'invite',{id:crypto.randomUUID(),token_hash:'e'.repeat(64)},id);await expect(cmd(other,'join',{hash:'e'.repeat(64),participant_id:crypto.randomUUID()},null)).rejects.toThrow(/manual friend/);
 await cmd(owner,'invite',{id:crypto.randomUUID(),token_hash:'f'.repeat(64),claim_participant_id:guest},id);await cmd(other,'join',{hash:'f'.repeat(64),confirm_claim:true},null);await expect(cmd(owner,'add_participant',{id:crypto.randomUUID(),name:'Third'},id)).rejects.toThrow(/two/);await expect(cmd(third,'join',{hash:'f'.repeat(64),confirm_claim:true},null)).rejects.toThrow(/two/);
 const e=crypto.randomUUID();await cmd(other,'expense',{id:e,version:0,title:'Only guest benefits',amount_minor:101,date:'2026-10-01',payer_id:mine,split_method:'equal',shares:[{participant_id:guest}]},id);const pair=(await as(other,'select * from shared_pairs($1)',[id])).rows[0];expect(pair).toEqual({debtor_id:guest,creditor_id:mine,amount_minor:101});
 await cmd(owner,'expense',{id:e,version:1,title:'Corrected by owner',amount_minor:99,date:'2026-10-01',payer_id:mine,split_method:'equal',shares:[{participant_id:guest}],confirm_change:true},id);await expect(cmd(other,'expense',{id:e,version:1,title:'Stale',amount_minor:101,date:'2026-10-01',payer_id:mine,split_method:'equal',shares:[{participant_id:guest}],confirm_change:true},id)).rejects.toThrow(/changed/);
 const pay=crypto.randomUUID();await cmd(other,'settlement',{id:pay,payer_id:guest,receiver_id:mine,amount_minor:99,date:'2026-10-02',method:'Cash'},id);await cmd(owner,'confirm_settlement',{id:pay,version:1},id);await cmd(other,'leave',{},id);
 await cmd(owner,'expense',{id:e,version:2,title:'Corrected note after departure',amount_minor:99,date:'2026-10-01',payer_id:mine,split_method:'equal',shares:[{participant_id:guest}],confirm_change:true},id);
 await expect(cmd(owner,'expense',{id:e,version:3,title:'Changing inactive share',amount_minor:100,date:'2026-10-01',payer_id:mine,split_method:'equal',shares:[{participant_id:guest}],confirm_change:true},id)).rejects.toThrow(/inactive/);
});
it('rejects foreign participants, invalid dates and fractional minor units atomically',async()=>{
 const base={id:crypto.randomUUID(),version:0,title:'Invalid',amount_minor:101,date:'2026-10-22',payer_id:pa,split_method:'equal',shares:[{participant_id:pa}]};
 await expect(cmd(a,'expense',{...base,payer_id:crypto.randomUUID()})).rejects.toThrow(/payer/);await expect(cmd(a,'expense',{...base,shares:[{participant_id:crypto.randomUUID()}]})).rejects.toThrow(/participants/);await expect(cmd(a,'expense',{...base,date:'not-a-date'})).rejects.toThrow();await expect(cmd(a,'expense',{...base,amount_minor:1.5})).rejects.toThrow();await expect(cmd(a,'expense',{...base,amount_minor:-5})).rejects.toThrow();await expect(as(a,"insert into shared_contexts(id,kind,name,owner_id) values($1,'group','Forged',$2)",[crypto.randomUUID(),a])).rejects.toThrow();
});
it('returns complete date-filtered reports and private aggregate summaries',async()=>{
 const report=(await as(a,"select shared_report($1,'2026-10-22','2026-10-22') r",[cid])).rows[0].r as any;expect(report.categories.reduce((n:number,r:any)=>n+r.amount_minor,0)).toBe(10203);expect(report.people.reduce((n:number,r:any)=>n+r.paid_minor,0)).toBe(10203);expect(report.people.reduce((n:number,r:any)=>n+r.share_minor,0)).toBe(10203);const summaries=(await as(a,'select shared_summary() r')).rows[0].r as any[];expect(summaries.find(s=>s.context.id===cid).total_minor).toBe(10203);
 await db.exec('set role anon');await expect(db.query('select shared_summary()')).rejects.toThrow();await db.exec('reset role');
});
it('reports inclusive dates, complete totals, privacy and repayment states without changing all-time debt',async()=>{
 const id=crypto.randomUUID(),mine=crypto.randomUUID(),guest=crypto.randomUUID();await cmd(a,'create_context',{id,participant_id:mine,kind:'direct',name:'Reporting fixture',friend_id:guest,friend_name:'Tracked fixture'},null);
 const add=async(date:string,amount:number)=>cmd(a,'expense',{id:crypto.randomUUID(),version:0,title:'Reporting boundary',amount_minor:amount,date,payer_id:mine,split_method:'equal',shares:[{participant_id:mine},{participant_id:guest}]},id);
 await add('2026-09-30',200);await add('2026-10-01',360000);await add('2026-10-31',10000);await add('2026-11-01',400);
 // More than one visible page must not truncate any aggregate.
 for(let n=0;n<21;n++)await add('2026-10-15',100);
 const payment=crypto.randomUUID();await cmd(a,'settlement',{id:payment,payer_id:guest,receiver_id:mine,amount_minor:10000,date:'2026-11-01',method:'Cash'},id);
 const before=(await as(a,'select shared_pairs($1) p',[id])).rows;
 const r=(await as(a,"select shared_report($1,'2026-10-01','2026-10-31') r",[id])).rows[0].r as any;
 expect(r.totals).toEqual({spending_minor:372100,paid_minor:372100,share_minor:186050,expense_count:23});expect(r.timeline.reduce((n:number,x:any)=>n+x.amount_minor,0)).toBe(372100);expect(r.timeline.map((x:any)=>x.date)).toEqual(['2026-10-01','2026-10-15','2026-10-31']);expect(r.repayments).toEqual([]);
 expect((await as(a,"select shared_report($1,'2026-11-01','2026-11-01') r",[id])).rows[0].r).toMatchObject({repayments:[{status:'confirmed',amount_minor:10000,count:1}]});
 expect((await as(a,'select shared_pairs($1) p',[id])).rows).toEqual(before);
 await expect(as(b,'select shared_report($1)',[id])).rejects.toThrow(/unavailable/);const other=(await as(b,"select shared_report(null,'2026-10-01','2026-10-31') r")).rows[0].r as any;expect(other.people.some((p:any)=>p.context_id===id)).toBe(false);
 await expect(as(a,"select shared_report($1,'2026-10-31','2026-10-01')",[id])).rejects.toThrow(/valid date/);
 await db.exec('set role anon');await expect(db.query('select shared_report()')).rejects.toThrow();await db.exec('reset role');
});
it('expires invitations, rate-limits invalid previews and supports safe zero-balance leaving',async()=>{
 const invitation=crypto.randomUUID(),hash='1'.repeat(64);await cmd(a,'invite',{id:invitation,token_hash:hash});await db.query("update shared_invitations set expires_at=now()-interval '1 second' where id=$1",[invitation]);expect((await as(b,'select shared_invite_preview($1) r',[hash])).rows[0].r).toHaveProperty('error');
 const fresh=crypto.randomUUID();await db.query('insert into auth.users values($1)',[fresh]);for(let i=0;i<21;i++)await as(fresh,'select shared_invite_preview($1)',['missing']);expect((await as(fresh,'select shared_invite_preview($1) r',['missing'])).rows[0].r).toHaveProperty('error','Too many attempts. Wait a minute.');
 await cmd(outsider,'leave',{});expect((await as(outsider,'select * from shared_contexts where id=$1',[cid])).rows).toHaveLength(0);expect((await as(a,'select * from shared_participants where id=$1',[manual])).rows[0].active).toBe(false);
});
it('archives with balance acknowledgement and preserves collaboration after identity deletion',async()=>{await expect(cmd(a,'edit_context',{version:1,name:'Trip',archived:true})).rejects.toThrow(/Confirm/);await cmd(a,'edit_context',{version:1,name:'Trip',archived:true,confirm_balances:true});await expect(cmd(b,'add_participant',{id:crypto.randomUUID(),name:'X'})).rejects.toThrow(/archived/);await db.query('delete from auth.users where id=$1',[a]);const c=(await as(b,'select * from shared_contexts where id=$1',[cid])).rows[0];expect(c.owner_id).toBe(b);expect((await as(b,'select * from shared_expenses')).rows.length).toBe(3);});
