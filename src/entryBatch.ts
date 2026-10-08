import type { Entry } from './types';

export function sameEntry(a: Entry, b: Entry) {
  return ['id','user_id','category_id','date','amount_minor','currency','notes','withdrawal'].every(key=>a[key as keyof Entry]===b[key as keyof Entry]) && (a.subcategory_id??null)===(b.subcategory_id??null) && (a.payment_method??null)===(b.payment_method??null);
}
export function reconcileEntries(requested: Entry[], saved: Entry[]) {
  if (!saved.length) return false;
  if (saved.length===requested.length && requested.every(e=>saved.some(s=>sameEntry(e,s)))) return true;
  throw new Error('Some records with these entry IDs already exist with different details. Refresh Money Log to review them before starting another entry session.');
}
// One insert statement is atomic in PostgreSQL. IDs are retained by the form across retries.
export async function insertEntriesOnce(entries: Entry[], insert: (entries:Entry[])=>Promise<void>, read: (ids:string[])=>Promise<Entry[]>) {
  if (!entries.length || entries.length>50 || new Set(entries.map(e=>e.id)).size!==entries.length || entries.some(e=>e.user_id!==entries[0].user_id)) throw new Error('Choose between 1 and 50 entries with unique IDs for the same account.');
  const before = await read(entries.map(e=>e.id));
  if (reconcileEntries(entries,before)) return;
  try { await insert(entries); }
  catch (original) {
    // A response can be lost after commit. Confirm the exact payload before offering a retry.
    let after:Entry[];
    try { after=await read(entries.map(e=>e.id)); } catch { throw original; }
    if (reconcileEntries(entries,after)) return;
    throw original;
  }
}
