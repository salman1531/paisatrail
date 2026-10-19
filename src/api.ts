import { insertEntriesOnce } from './entryBatch';
import { createClient } from '@supabase/supabase-js';
import type { Entry, Ledger, Profile, Category, Subcategory, PeriodGoal, IncomeSource, ExpectedPayment, SpendingBudget, BudgetAllocation, NamedGoal, GoalContributionPlan, BudgetCycle, PlanningPeriod, RemovedEntry } from './types';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
// Keep email-link credentials in memory until the visitor explicitly accepts the verified identity.
const fragment = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.hash.slice(1));
export const emailCallback = fragment.has('access_token') ? {access_token:fragment.get('access_token')!,refresh_token:fragment.get('refresh_token') ?? '',recovery:fragment.get('type')==='recovery'} : null;
if(emailCallback) history.replaceState(null,'',location.pathname+location.search);
export const initialPasswordRecovery = typeof window !== 'undefined' && sessionStorage.getItem('paisatrail-password-recovery') === 'true';
export const supabase = configured ? createClient(url, key, { auth: { flowType: 'implicit', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true } }) : null;
function db() { if (!supabase) throw new Error('Email sign-in is not connected yet.'); return supabase; }
function assert(error: { message: string } | null) { if (error) throw new Error(error.message); }
export async function loadLedger(userId: string): Promise<Ledger> {
  const client = db();
  const init = await client.rpc('initialize_ledger', { p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); assert(init.error);
  const [cats, profile] = await Promise.all([client.from('categories').select('*').eq('user_id', userId).order('created_at'), client.from('profiles').select('*').eq('user_id', userId).single()]);
  assert(cats.error); assert(profile.error);
  const subcategories: Subcategory[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await client.from('subcategories').select('*').eq('user_id', userId).order('created_at').order('id').range(offset, offset + 499);
    assert(page.error); subcategories.push(...(page.data as Subcategory[])); if (page.data!.length < 500) break;
  }
  // Page through the complete ledger so large histories aren't silently truncated by the API's row limit.
  const entries: Entry[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await client.from('entries').select('*').eq('user_id', userId).order('date', { ascending: false }).order('id').range(offset, offset + 499);
    assert(page.error); entries.push(...(page.data as Entry[])); if (page.data!.length < 500) break;
  }
  const goals: PeriodGoal[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await client.from('period_goals').select('*').eq('user_id', userId).order('id').range(offset, offset + 499);
    assert(page.error); goals.push(...(page.data as PeriodGoal[])); if (page.data!.length < 500) break;
  }
  async function pages<T>(table:string):Promise<T[]> {const rows:T[]=[];for(let offset=0;;offset+=500){const r=await client.from(table).select('*').eq('user_id',userId).order('id').range(offset,offset+499);assert(r.error);rows.push(...r.data as T[]);if(r.data!.length<500)return rows;}}
  const [incomeSources,expectedPayments,spendingBudgets,budgetAllocations,namedGoals,contributionPlans,budgetCycles,removedEntries]=await Promise.all([pages<IncomeSource>('income_sources'),pages<ExpectedPayment>('expected_payments'),pages<SpendingBudget>('spending_budgets'),pages<BudgetAllocation>('budget_allocations'),pages<NamedGoal>('named_goals'),pages<GoalContributionPlan>('goal_contribution_plans'),pages<BudgetCycle>('budget_cycles'),pages<RemovedEntry>('removed_entries')]);
  return { categories: cats.data as Category[], subcategories, entries, profile: profile.data as Profile, goals,incomeSources,expectedPayments,spendingBudgets,budgetAllocations,namedGoals,contributionPlans,budgetCycles,removedEntries };
}
export async function saveEntry(entry: Entry, editing: boolean) {
  if (!editing) return saveEntries([entry]);
  const client = db();
  const { error, data } = editing ? await client.from('entries').update(entry).eq('id', entry.id).eq('user_id', entry.user_id).select('id').single() : await client.from('entries').insert(entry).select('id').single();
  assert(error); if (!data) throw new Error('Entry was not saved.');
}
export async function deleteEntry(id:string,_userId:string){const r=await db().rpc('remove_recorded_entry',{p_id:id});assert(r.error);}
export async function restoreEntry(id:string){const r=await db().rpc('restore_recorded_entry',{p_id:id});assert(r.error);}
export async function matchExpectedReceipt(entryId:string,paymentId:string){const r=await db().rpc('match_expected_receipt',{p_entry_id:entryId,p_payment_id:paymentId});assert(r.error);}

export async function saveCategory(category: Category, editing: boolean) {
  const r = editing ? await db().from('categories').update(category).eq('id', category.id).eq('user_id', category.user_id).select('id').single() : await db().from('categories').insert(category).select('id').single(); assert(r.error);
}
export async function removeCategory(category: Category, hasEntries: boolean) {
  const r = hasEntries ? await db().from('categories').update({ archived: true }).eq('id', category.id).eq('user_id', category.user_id).select('id').single() : await db().from('categories').delete().eq('id', category.id).eq('user_id', category.user_id).select('id').single(); assert(r.error);
}
export async function saveSubcategory(subcategory: Subcategory, editing: boolean) {
  const r = editing ? await db().from('subcategories').update(subcategory).eq('id', subcategory.id).eq('user_id', subcategory.user_id).select('id').single() : await db().from('subcategories').insert(subcategory).select('id').single(); assert(r.error);
}
export async function removeSubcategory(subcategory: Subcategory, hasEntries: boolean) {
  const r = hasEntries ? await db().from('subcategories').update({ archived: true }).eq('id', subcategory.id).eq('user_id', subcategory.user_id).select('id').single() : await db().from('subcategories').delete().eq('id', subcategory.id).eq('user_id', subcategory.user_id).select('id').single(); assert(r.error);
}
export async function saveProfile(profile: Profile) { const r = await db().from('profiles').update(profile).eq('user_id', profile.user_id).select('user_id').single(); assert(r.error); }

export async function savePeriodGoals(period: string, currency: string, goals: PeriodGoal[]) {
  const r = await db().rpc('replace_period_goals', { p_period: period, p_currency: currency, p_goals: goals.map(g => ({ kind: g.kind, category_id: g.category_id, target_minor: g.target_minor })) }); assert(r.error);
}

export async function saveEntries(entries: Entry[]) {
  const client=db();
  await insertEntriesOnce(entries,async payload=>{
    const result=await client.from('entries').insert(payload).select('id'); assert(result.error);
    if(result.data?.length!==payload.length)throw new Error('Could not confirm every saved entry. Retry this session without starting a new one.');
  },async ids=>{
    const result=await client.from('entries').select('*').eq('user_id',entries[0].user_id).in('id',ids);assert(result.error);return result.data as Entry[];
  });
}

async function savePlanning(table:string,row:{id:string;user_id:string},editing:boolean){const r=editing?await db().from(table).update(row).eq('id',row.id).eq('user_id',row.user_id).select('id').single():await db().from(table).insert(row).select('id').single();assert(r.error);}
export async function saveIncomeSource(row:IncomeSource,payment?:ExpectedPayment){const r=await db().rpc('save_income_source',{p_source:row,p_payment:payment??null});assert(r.error);}
export async function saveExpectedPayment(row:ExpectedPayment,editing:boolean){await savePlanning('expected_payments',row,editing);}
export async function saveSpendingBudget(budget:SpendingBudget,items:BudgetAllocation[]){const r=await db().rpc('replace_spending_budget',{p_budget:budget,p_items:items});assert(r.error);}
export async function saveNamedGoal(goal:NamedGoal,period:PlanningPeriod,amount:number|null,legacyId?:string,entryIds:string[]=[]){const r=await db().rpc('save_goal_with_entries',{p_goal:goal,p_start:period.start,p_end:period.end,p_amount:amount,p_entry_ids:entryIds,p_legacy_id:legacyId??null});assert(r.error);}

export async function saveBudgetCycle(cycle:BudgetCycle){await savePlanning('budget_cycles',cycle,false);}

/** Association-only compare-and-set: another device cannot silently reassign a linked entry. */
export async function linkGoalEntry(entry:Entry){
 if(!entry.named_goal_id)throw new Error('Choose a goal to link.');
 const client=db();const result=await client.from('entries').update({named_goal_id:entry.named_goal_id}).eq('id',entry.id).eq('user_id',entry.user_id).is('named_goal_id',null).select('id');assert(result.error);
 if(result.data?.length===1)return;
 const existing=await client.from('entries').select('named_goal_id').eq('id',entry.id).eq('user_id',entry.user_id).maybeSingle();assert(existing.error);
 if(existing.data?.named_goal_id===entry.named_goal_id)return; // Safe retry after a lost response.
 throw new Error('This entry is no longer unlinked. Refresh and edit its association in Money Log if you want to move it.');
}
