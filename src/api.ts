import { createClient } from '@supabase/supabase-js';
import type { Entry, Ledger, Profile, Category, PeriodGoal } from './types';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
// Capture recovery before the auth client consumes and clears the callback fragment.
export const initialPasswordRecovery = typeof window !== 'undefined' && (new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery' || sessionStorage.getItem('paisatrail-password-recovery') === 'true');
if (initialPasswordRecovery) sessionStorage.setItem('paisatrail-password-recovery', 'true');
export const supabase = configured ? createClient(url, key, { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } }) : null;
function db() { if (!supabase) throw new Error('Email sign-in is not connected yet.'); return supabase; }
function assert(error: { message: string } | null) { if (error) throw new Error(error.message); }
export async function loadLedger(userId: string): Promise<Ledger> {
  const client = db();
  const init = await client.rpc('initialize_ledger', { p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); assert(init.error);
  const [cats, profile] = await Promise.all([client.from('categories').select('*').eq('user_id', userId).order('created_at'), client.from('profiles').select('*').eq('user_id', userId).single()]);
  assert(cats.error); assert(profile.error);
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
  return { categories: cats.data as Category[], entries, profile: profile.data as Profile, goals };
}
export async function saveEntry(entry: Entry, editing: boolean) {
  const client = db();
  const { error, data } = editing ? await client.from('entries').update(entry).eq('id', entry.id).eq('user_id', entry.user_id).select('id').single() : await client.from('entries').insert(entry).select('id').single();
  assert(error); if (!data) throw new Error('Entry was not saved.');
}
export async function deleteEntry(id: string, userId: string) { const r = await db().from('entries').delete().eq('id', id).eq('user_id', userId).select('id').single(); assert(r.error); }
export async function saveCategory(category: Category, editing: boolean) {
  const r = editing ? await db().from('categories').update(category).eq('id', category.id).eq('user_id', category.user_id).select('id').single() : await db().from('categories').insert(category).select('id').single(); assert(r.error);
}
export async function removeCategory(category: Category, hasEntries: boolean) {
  const r = hasEntries ? await db().from('categories').update({ archived: true }).eq('id', category.id).eq('user_id', category.user_id).select('id').single() : await db().from('categories').delete().eq('id', category.id).eq('user_id', category.user_id).select('id').single(); assert(r.error);
}
export async function saveProfile(profile: Profile) { const r = await db().from('profiles').update(profile).eq('user_id', profile.user_id).select('user_id').single(); assert(r.error); }

export async function savePeriodGoals(period: string, currency: string, goals: PeriodGoal[]) {
  const r = await db().rpc('replace_period_goals', { p_period: period, p_currency: currency, p_goals: goals.map(g => ({ kind: g.kind, category_id: g.category_id, target_minor: g.target_minor })) }); assert(r.error);
}
