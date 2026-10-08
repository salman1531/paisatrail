import Modal from './Modal';
import CategoryPicker from './CategoryPicker';
import CashFlowChart from './CashFlowChart';
import PaymentTypeField, {paymentTypes,validatePaymentType} from './PaymentTypeField';
import AdminPanel from './AdminPanel';
import EmailCallback from './EmailCallback';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, Download, LogOut, Pencil, PiggyBank, Plus, Search, Settings, ShieldCheck, Tags, Trash2, TrendingUp, Wallet } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { configured, supabase, emailCallback, initialPasswordRecovery, loadLedger, saveEntries, saveEntry, deleteEntry, saveCategory, removeCategory, saveSubcategory, removeSubcategory, saveProfile, savePeriodGoals } from './api';
import { newDemo, persistDemo, readDemo } from './demo';
import CategoryComparison from './CategoryComparison';
import { GoalsEditor } from './PeriodGoals';
import QuickExpense from './QuickExpense';
import { categoryChoices, customCategoryChoice, namedCategory } from './expenseChoices';
import BrandMark from './BrandMark';
import AmountWords from './AmountWords';
import { Login, PasswordForm } from './Auth';
import { reportingLedger, preferenceUpdate } from './reporting';
import OverviewSummary from './OverviewSummary';
import BudgetDashboard, {type DrillScope} from './BudgetDashboard';
import CategoriesPanel from './CategoriesPanel';
import ExpenseBatchForm, {type ExpenseSubmission} from './ExpenseBatchForm';
import ReportPeriod, {reportPeriodLabel} from './ReportPeriod';
import {reconcileEntries} from './entryBatch';
import DashboardDetails from './DashboardDetails';
import { dateLabel, emergency, filtered, inputAmount, kindLabels, money, parseAmount, today, totals, validDate } from './finance';
import { currencies, kinds, type Category, type Subcategory, type Currency, type Entry, type Filter, type Kind, type Ledger, type PeriodGoal, type Profile } from './types';
const icons = { expense: Wallet, saving: PiggyBank, investment: TrendingUp, income: ArrowDownLeft };

function PageLoader() { return <div className="loading" role="status" aria-live="polite" aria-busy="true"><BrandMark/><span className="loading-spinner" aria-hidden="true"/><h2>Opening your ledger…</h2><p>Loading your account and financial overview.</p></div>; }
function ErrorMessage({ message }: { message: string }) { return message ? <p className="form-error" role="alert">{message}</p> : null; }

export default function App() {
  const [user, setUser] = useState<User | null>(null); const [authLoading, setAuthLoading] = useState(configured); const [demo, setDemo] = useState(false);
  const [callbackPending,setCallbackPending]=useState(Boolean(emailCallback));
  const [isAdmin,setIsAdmin]=useState(false);
  const identity = useRef<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(initialPasswordRecovery);
  function finishRecovery() { sessionStorage.removeItem('paisatrail-password-recovery'); setPasswordRecovery(false); }
  const [ledger, setLedger] = useState<Ledger | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [requestedTab, setTab] = useState('overview');
  const tab = requestedTab === 'admin' && (!user || demo || !isAdmin) ? 'overview' : requestedTab; const [filter, setFilter] = useState<Filter>({ year: today().slice(0, 4), month: today().slice(5, 7), category: 'all' }); const [search, setSearch] = useState('');
  const [entryCategory,setEntryCategory]=useState('all');
  const [entryPayment,setEntryPayment]=useState('all');
  const [entryKind,setEntryKind]=useState<Kind|'all'>('all');
  const [entrySubcategory,setEntrySubcategory]=useState('');
  const [batchModal,setBatchModal]=useState(false);
  const [entryCurrency,setEntryCurrency]=useState<Currency | 'all'>('all');
  const [goalContext,setGoalContext]=useState<{period:string;currency:Currency}|null>(null);
  const [emergencyDraftDirty,setEmergencyDraftDirty]=useState(false);
  const [goalDraftDirty,setGoalDraftDirty]=useState(false);
  const [reportCurrency,setReportCurrency]=useState<Currency | null>(null);
  const entrySaving = useRef(false);
  const [newEntryKind, setNewEntryKind] = useState<Kind>('expense');
  function openNewEntry(kind: Kind = 'expense') { setNewEntryKind(kind); setEntryModal('new'); }
  const [entryModal, setEntryModal] = useState<Entry | 'new' | null>(null); const [categoryModal, setCategoryModal] = useState<Category | 'new' | null>(null); const [subcategoryModal, setSubcategoryModal] = useState<Subcategory | { category_id: string } | null>(null); const [confirmation, setConfirmation] = useState<{ title: string; message: string; actionLabel?: string; entry?: Entry; action: () => Promise<void> } | null>(null);
  const planningDirty = goalDraftDirty || emergencyDraftDirty;
  function resetWorkspace() {
    setTab('overview'); setGoalContext(null); setGoalDraftDirty(false); setEmergencyDraftDirty(false);
    setIsAdmin(false); setEntryKind('all');setEntryPayment('all');setEntrySubcategory('');setBatchModal(false);setSearch(''); setEntryCategory('all'); setEntryCurrency('all'); setReportCurrency(null);
    setEntryModal(null); setCategoryModal(null); setSubcategoryModal(null); setConfirmation(null); setNotice('');
    setFilter({year:today().slice(0,4),month:today().slice(5,7),category:'all'});
  }
  function navigate(next: string) {
    if (next === 'plan' && !goalContext && ledger) {
      const currentMonth=today(ledger.profile.timezone).slice(0,7);
      setGoalContext({period:filter.startDate?.slice(0,7)??(filter.year==='all'?currentMonth:filter.year+'-'+(filter.month==='all'?currentMonth.slice(5):filter.month)),currency:reportCurrency??ledger.profile.currency});
    }
    setTab(next);if(next!==requestedTab)window.scrollTo({top:0,behavior:'instant'});
  }
  useEffect(()=>{
    if (!planningDirty) return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[planningDirty]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    function updateIdentity(next: User | null) { if (!alive) return; if (identity.current !== (next?.id ?? null)) { identity.current = next?.id ?? null; setLedger(null); setDemo(false); resetWorkspace(); } setUser(next); setAuthLoading(false); }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY') { sessionStorage.setItem('paisatrail-password-recovery', 'true'); setPasswordRecovery(true); } if (event === 'SIGNED_OUT') finishRecovery(); updateIdentity(session?.user ?? null); });
    supabase.auth.getSession().then(({ data, error }) => { updateIdentity(data.session?.user ?? null); if (alive && error) setError(error.message); }).catch(e => { if (alive) { setError(String(e)); setAuthLoading(false); } });
    const callbackError = new URLSearchParams(location.hash.slice(1)).get('error_description'); if (callbackError) { setError(callbackError.replace(/\+/g, ' ')); history.replaceState(null, '', location.pathname); }
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (callbackPending) return;
    if (demo) { const sample=readDemo();setLedger(sample);setReportCurrency(sample.profile.currency); return; }
    if (!user) { setLedger(null); return; }
    let alive = true; setBusy(true); setError('');
    loadLedger(user.id).then(v => { if (alive) { setLedger(v); setReportCurrency(v.profile.currency); const date = today(v.profile.timezone); setFilter({ year: date.slice(0, 4), month: date.slice(5, 7), category: 'all' }); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [user?.id, demo, callbackPending]);
  useEffect(()=>{
    setIsAdmin(false); if(!supabase||!user||demo||callbackPending)return;
    let alive=true;const client=supabase;
    client.rpc('is_paisatrace_admin').then(({data,error})=>{if(alive)setIsAdmin(!error&&data===true);});
    const activity=()=>{if(document.visibilityState==='visible')void client.rpc('record_paisatrace_activity').then(()=>{});};
    activity();const timer=setInterval(activity,5*60*1000);document.addEventListener('visibilitychange',activity);
    return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',activity);};
  },[user?.id,demo,callbackPending]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(t); }, [notice]);
  async function mutate(work: () => Promise<void>, next: Ledger, success: string) {
    setBusy(true); setError('');
    try { if (demo) { persistDemo(next); setLedger(next); } else { await work(); setLedger(await loadLedger(user!.id)); } setNotice(success); }
    catch (e) { throw new Error(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }
  if(callbackPending&&emailCallback) return <EmailCallback callback={emailCallback} accepted={()=>{if(emailCallback?.recovery){sessionStorage.setItem('paisatrail-password-recovery','true');setPasswordRecovery(true);}else finishRecovery();setCallbackPending(false);}} cancel={()=>setCallbackPending(false)}/>;
  async function performSignOut() { setError(''); if (demo) { resetWorkspace(); setDemo(false); setLedger(null); return; } const r = await supabase?.auth.signOut(); if (r?.error) throw new Error(r.error.message); resetWorkspace(); setUser(null); setLedger(null); }
  async function signOut() {
    if(planningDirty){setConfirmation({title:'Leave your unsaved plan?',message:'Your goal draft is kept while you visit other tabs. Signing out discards it. Save your goals first, or discard the draft to continue.',actionLabel:demo?'Discard and exit demo':'Discard and sign out',action:performSignOut});return;}
    try{await performSignOut();}catch(e){setError((e as Error).message);}
  }
  if (authLoading) return <PageLoader/>;
  if (!demo && !user) return <Login enterDemo={() => { resetWorkspace(); setError(''); setDemo(true); }} authError={error} links={<PublicLinks/>}/>;
  if (user && passwordRecovery) return <main className="recovery-shell"><BrandMark/><PasswordForm recovery done={finishRecovery}/><button className="text-button" onClick={signOut}>Sign out</button><PublicLinks/></main>;
  if (!ledger && !error) return <PageLoader/>;
  if (!ledger) return <div className="loading"><BrandMark/><h2>{busy ? 'Opening your ledger…' : 'Could not open your ledger'}</h2><ErrorMessage message={error}/><button className="button" onClick={() => location.reload()}>Try again</button><button className="text-button" onClick={signOut}>Sign out</button></div>;
  const currency = reportCurrency ?? ledger.profile.currency;
  const report = reportingLedger(ledger,currency);
  const entryFilter={...filter,category:entryCategory,currency:entryCurrency,kind:entryKind,subcategory:entrySubcategory||undefined,payment:entryPayment};
  const recentEntries=filtered(ledger.entries,{...filter,category:'all',currency}).sort((a,b)=>b.date.localeCompare(a.date));

  const scopedEntries=filtered(ledger.entries,entryFilter).filter(e=>entryKind==='all'||ledger.categories.find(c=>c.id===e.category_id)?.kind===entryKind);
  const fund=emergency(reportingLedger(ledger,ledger.profile.planning_currency ?? ledger.profile.currency));
  const visible = scopedEntries.filter(e => { const c = ledger.categories.find(c => c.id === e.category_id)!; const s = (ledger.subcategories ?? []).find(s => s.id === e.subcategory_id); return `${e.notes} ${e.payment_method??''} ${c.name} ${s?.name ?? ''} ${kindLabels[c.kind]}`.toLowerCase().includes(search.toLowerCase()); });
  const listEntries=tab==='overview'?recentEntries:visible;
  const years = [...new Set([today(ledger.profile.timezone).slice(0, 4), filter.year, ...ledger.entries.map(e => e.date.slice(0, 4))])].filter(y => y !== 'all').sort().reverse();
  const period = reportPeriodLabel(filter);
  async function exportExcel(all = false) { setBusy(true); setError(''); try { const exportLedger = demo ? ledger! : await loadLedger(user!.id); const { downloadWorkbook } = await import('./export'); await downloadWorkbook(exportLedger, filtered(exportLedger.entries, all ? {year:'all',month:'all',category:'all'} : entryFilter).filter(e => { const c = exportLedger.categories.find(c => c.id === e.category_id)!; const s = (exportLedger.subcategories ?? []).find(s => s.id === e.subcategory_id); return (all || entryKind==='all' || c.kind===entryKind) && `${e.notes} ${e.payment_method??''} ${c.name} ${s?.name ?? ''} ${kindLabels[c.kind]}`.toLowerCase().includes(all ? '' : search.toLowerCase()); }), all ? {year:'all',month:'all',category:'all'} : entryFilter); setNotice('Excel export downloaded.'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  async function storeGoals(period: string, goals: PeriodGoal[]) { await mutate(() => savePeriodGoals(period, goals[0].currency, goals), { ...ledger!, goals: [...(ledger!.goals ?? []).filter(g => g.period !== period || g.currency !== goals[0].currency), ...goals] }, 'Monthly goals saved.'); setReportCurrency(goals[0].currency); setFilter({year:period.slice(0,4),month:period.slice(5,7),category:'all'}); }
  async function storeEntry(entry: Entry, editing: boolean, custom?: {kind:Kind;name:string}) {
    if (entrySaving.current) throw new Error('Please wait for the current entry to finish saving.');
    entrySaving.current=true; setBusy(true);
    try {
      // Reload before creating a name so retrying a failed entry can reuse an already saved category.
      const source = custom && !demo ? await loadLedger(user!.id) : ledger!;
      const planned = custom ? namedCategory(source,custom.kind,custom.name,crypto.randomUUID()) : null;
      const saved = planned ? {...entry,category_id:planned.category.id,subcategory_id:null} : entry;
      const next = {...source,categories:planned?.isNew?[...source.categories,planned.category]:source.categories,entries:editing?source.entries.map(e=>e.id===saved.id?saved:e):[...source.entries,saved]};
      await mutate(async()=>{if(planned?.isNew)await saveCategory(planned.category,false);await saveEntry(saved,editing);},next,editing?'Entry updated.':'Entry added.');
      setFilter({year:saved.date.slice(0,4),month:saved.date.slice(5,7),category:'all'}); setSearch(''); setEntryCategory('all');setEntrySubcategory('');setEntryKind('all');setEntryPayment('all');setEntryCurrency('all');setReportCurrency(saved.currency); return saved;
    } finally {entrySaving.current=false;setBusy(false);}
  }
  function drillRecords(scope?:DrillScope) {
    setSearch('');setEntryCategory(scope?.categoryId??'all');setEntrySubcategory(scope?.subcategoryId??'');setEntryKind(scope?.kind??'all');setEntryPayment('all');setEntryCurrency(currency);navigate('entries');window.scrollTo({top:0,behavior:'instant'});
  }
  async function storeExpenseBatch(submissions:ExpenseSubmission[]) {
    if(entrySaving.current)throw new Error('Please wait for the current save.');
    entrySaving.current=true;setBusy(true);setError('');
    try {
      const source=demo?ledger!:await loadLedger(user!.id);
      const categories=[...source.categories];const newCategories:Category[]=[];
      const entries=submissions.map(({entry,customName})=>{
        if(entry.user_id!==source.profile.user_id||entry.withdrawal)throw new Error('Choose expenses in your own account.');
        if(!customName){if(categories.find(c=>c.id===entry.category_id)?.kind!=='expense')throw new Error('Choose an expense category.');return entry;}
        const plan=namedCategory({...source,categories},'expense',customName,crypto.randomUUID());
        if(plan.isNew){categories.push(plan.category);newCategories.push(plan.category);}
        return {...entry,category_id:plan.category.id,subcategory_id:null};
      });
      if(demo){
        const existing=source.entries.filter(e=>entries.some(row=>row.id===e.id));
        if(!reconcileEntries(entries,existing)){const next={...source,categories,entries:[...source.entries,...entries]};persistDemo(next);setLedger(next);}
      } else {
        for(const category of newCategories)await saveCategory(category,false);
        await saveEntries(entries);
        setLedger(await loadLedger(user!.id));
      }
      const latest=entries.map(e=>e.date).sort().at(-1)!;
      setFilter({year:latest.slice(0,4),month:latest.slice(5,7),category:'all'});setReportCurrency(entries[0].currency);setSearch('');setEntryKind('expense');setEntryPayment('all');setEntryCategory('all');setEntrySubcategory('');setEntryCurrency(entries[0].currency);
      setNotice(`${entries.length} expenses saved. Reports opened for ${reportPeriodLabel({year:latest.slice(0,4),month:latest.slice(5,7),category:'all'})}.`);
    } finally {entrySaving.current=false;setBusy(false);}
  }
  function confirmDelete(e: Entry) { setConfirmation({ title: 'Delete this entry?', message: 'Permanently remove this record from your entries and reports?', actionLabel:'Delete entry', entry:e, action: async () => { await mutate(() => deleteEntry(e.id, ledger!.profile.user_id), { ...ledger!, entries: ledger!.entries.filter(x => x.id !== e.id) }, 'Entry deleted.'); } }); }
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('overview'); }}><span className="brand-mark"><BrandMark size={30}/></span>Paisa<span className="brand-light">Trace</span></a><div className="workspace-label">YOUR PERSONAL FINANCES</div><nav aria-label="Main navigation">{[{ id: 'overview', name: 'Overview', Icon: BarChart3 }, { id: 'entries', name: 'Money Log', Icon: CalendarDays }, { id: 'categories', name: 'Categories', Icon: Tags }, { id: 'plan', name: 'Goals', Icon: PiggyBank }, { id: 'settings', name: 'Settings', Icon: Settings }].map(({ id, name, Icon }) => <button key={id} className={tab === id ? 'nav-item active' : 'nav-item'} onClick={() => { navigate(id); }} aria-label={name} title={name} aria-current={tab === id ? 'page' : undefined}><Icon size={19}/><span className={id==='entries'?'nav-label-desktop':undefined}>{name}</span>{id==='entries'&&<span className="nav-label-mobile">Money Log</span>}</button>)}</nav><div className="sidebar-bottom"><div className="private-note"><ShieldCheck size={18}/><span>{demo ? 'Demo workspace' : 'Your own private space'}</span></div><div className="account"><div className="avatar">{demo ? 'D' : (user?.email?.[0] ?? 'U').toUpperCase()}</div><div><strong>{demo ? 'Demo account' : 'My account'}</strong><span title={user?.email}>{demo ? 'Sample data only' : user?.email}</span></div><button className="icon-button" aria-label={demo ? 'Exit demo' : 'Sign out'} onClick={signOut}><LogOut size={18}/></button></div></div></aside>
    <main className="main">
      {demo && <div className="demo-banner"><span><strong>Demo mode</strong> · Fictional sample data · saved in this browser.</span><label><span className="sr-only">Demo scenario currency</span><select aria-label="Demo scenario currency" value={ledger.profile.currency} onChange={e=>{const chosen=e.target.value as Currency;setConfirmation({title:"Load "+chosen+" demo?",message:"This discards any unsaved goal draft and replaces this browser’s sample changes with a fictional "+chosen+" scenario. Your real account is unchanged.",action:async()=>{const fresh=newDemo(chosen);persistDemo(fresh);resetWorkspace();setLedger(fresh);setReportCurrency(chosen);setSearch('');setEntryCategory('all');}});}}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label><button onClick={() => setConfirmation({ title: 'Reset demo?', message: 'Your changes to the sample data and any unsaved goal draft will be removed.', action: async () => { const fresh = newDemo(ledger.profile.currency); persistDemo(fresh); resetWorkspace();setLedger(fresh);setReportCurrency(fresh.profile.currency);setSearch('');setEntryCategory('all'); } })}>Reset demo</button></div>}
      <header className="page-header"><div><p className="eyebrow">A LITTLE CLARITY, EVERY DAY</p><h1>{tab === 'overview' ? 'Your money, at a glance.' : tab === 'entries' ? 'Money Log' : tab === 'categories' ? 'Your categories' : tab === 'plan' ? 'Your monthly goals' : tab === 'admin' ? 'Account administration' : 'Settings'}</h1><p className={tab==='entries'?'subtitle money-log-subtitle':'subtitle'}>{tab === 'overview' ? 'See what remains, stay within your budget, and track your progress.' : tab === 'entries' ? 'Everything you earn, spend, and set aside.' : tab === 'categories' ? 'Organize your money in a way that makes sense to you.' : tab === 'plan' ? 'A simple plan for your next steps.' : tab === 'admin' ? 'Review account activity and verified deletion requests.' : 'Make this space yours.'}</p></div><div className="header-actions"><a className="text-button guide-link" href="/guide.html" target="_blank" rel="noopener noreferrer">User guide ↗</a>{tab === 'entries' && <><button className="button" onClick={() => openNewEntry()} disabled={busy}><Plus size={19}/>Add entry</button><button className="button secondary" onClick={()=>setBatchModal(true)} disabled={busy}>Add multiple expenses</button></>}</div></header>
      <ErrorMessage message={error}/>{notice && <div className="toast" role="status"><Check size={17}/>{notice}</div>}
      {(tab === 'overview' || tab === 'entries' || tab === 'categories') && <ReportPeriod filter={filter} currency={currency} years={years} compact={tab==='overview'} change={setFilter} changeCurrency={setReportCurrency}/>}
      {(tab === 'overview' || tab === 'entries') && <>
      {tab === 'overview' && <><OverviewSummary ledger={report} filter={filter} busy={busy} addExpense={()=>openNewEntry()} editGoals={()=>navigate('plan')} details={kind=>drillRecords(kind?{kind}:undefined)}/><CashFlowChart ledger={report} filter={filter} drill={drillRecords}/></>}
      {tab==='entries'&&<div className="quick-entry-types" aria-label="Other entry types">{(['income','saving','investment'] as const).map(kind=><button key={kind} className="text-button" onClick={()=>openNewEntry(kind)}>Add {kind==='saving'?'savings':kind}</button>)}</div>}
      <section className="panel entries-panel"><div className="panel-head"><div><h2>{tab === 'overview' ? 'Recent entries' : 'All entries'}<span className="count">{listEntries.length}</span></h2><p>{period} · {tab==='overview'||entryCategory === 'all' ? 'All categories' : ledger.categories.find(c => c.id === entryCategory)?.name+' only'} · {tab==='overview'?currency+' only':entryCurrency==='all'?'Entries across all currencies':entryCurrency+' only'}</p></div>{tab==='entries'&&<div className="entry-filters"><label className="search-field"><Search size={16}/><input aria-label="Search entries" placeholder="Search entries" value={search} onChange={e => setSearch(e.target.value)}/></label><select aria-label="Filter category" value={entryCategory} onChange={e => {setEntryCategory(e.target.value);setEntrySubcategory('');}}><option value="all">All categories</option>{ledger.categories.filter(c=>entryKind==='all'||c.kind===entryKind).map(c => <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>)}</select><select aria-label="Filter entry type" value={entryKind} onChange={e=>{setEntryKind(e.target.value as Kind|'all');setEntryCategory('all');setEntrySubcategory('');}}><option value="all">All entry types</option>{kinds.map(k=><option key={k} value={k}>{kindLabels[k]}</option>)}</select><select aria-label="Filter payment type" value={entryPayment} onChange={e=>setEntryPayment(e.target.value)}><option value="all">All payment types</option><option value="__unspecified__">Not specified</option>{paymentTypes.map(p=><option key={p} value={p}>{p}</option>)}</select><select aria-label="Filter entry currency" value={entryCurrency} onChange={e=>setEntryCurrency(e.target.value as Currency|'all')}><option value="all">All entry currencies</option>{currencies.map(c=><option key={c} value={c}>{c} entries only</option>)}</select><button className="button secondary" onClick={()=>exportExcel()} disabled={busy}><Download size={17}/>Export Excel</button></div>}</div>{tab==='entries'&&<p className="entry-filter-note">Search, type, category, subcategory, payment type and entry currency filters apply to this list and its Excel export only.{entryKind!=='all'&&<span className="entry-scope-chip">{kindLabels[entryKind]} only</span>}{entryPayment!=='all'&&<span className="entry-scope-chip">{entryPayment==='__unspecified__'?'Payment not specified':entryPayment}</span>}{entrySubcategory&&<span className="entry-scope-chip">{entrySubcategory==='__none__'?'No subcategory':ledger.subcategories?.find(s=>s.id===entrySubcategory)?.name} only</span>}{(search || entryCategory !== 'all' || entryCurrency !== 'all' || entryKind!=='all' || entrySubcategory || entryPayment!=='all') && <button type="button" className="text-button" onClick={() => { setSearch('');setEntryKind('all');setEntryPayment('all');setEntrySubcategory(''); setEntryCategory('all'); setEntryCurrency('all'); }}>Clear entry filters</button>}</p>}<EntryTable entries={tab === 'overview' ? listEntries.slice(0, 5) : listEntries} ledger={ledger} edit={setEntryModal} remove={confirmDelete} busy={busy}/>{listEntries.length === 0 && <div className="empty"><CalendarDays size={30}/><h3>{ledger.entries.length ? 'No entries match this view' : 'A fresh start for your money'}</h3><p>{ledger.entries.length ? 'Try a different month, category, entry currency or search.' : 'Start with income or your first expense. Goals are optional.'}</p><button className="button secondary" onClick={() => openNewEntry()}><Plus size={17}/>Add entry</button></div>}{tab === 'overview' && <button className="view-all" onClick={() => drillRecords()}>Open Money Log · {listEntries.length} {currency} entries</button>}</section>
      {tab === 'entries' && <details className="overview-details entries-budget-summary"><summary>Monthly budget summary · All categories · {currency}</summary><BudgetDashboard ledger={report} filter={filter} drill={drillRecords} editGoals={()=>navigate('plan')}/></details>}
      {tab==='entries'&&<><details className="overview-details"><summary>Quick expense entry</summary><QuickExpense ledger={ledger} busy={busy} save={async(entry,customName)=>{const saved=await storeEntry(entry,false,customName?{kind:'expense',name:customName}:undefined);return saved.category_id;}}/></details><details className="overview-details"><summary>Income & spending trend</summary><DashboardDetails ledger={report} filter={filter} selectMonth={(year,month)=>setFilter({year,month,category:'all'})}/></details>{!filter.startDate&&filter.year!=='all'&&filter.month!=='all'&&<details className="overview-details"><summary>Compare with the previous month</summary><CategoryComparison ledger={ledger} currency={currency} filter={filter}/></details>}</>}
      <p className="page-foot">A clearer picture, one entry at a time.</p></>}
      {tab === 'categories' && <CategoriesPanel ledger={report} filter={filter} addCategory={()=>setCategoryModal('new')} busy={busy} editCategory={setCategoryModal} editSubcategory={setSubcategoryModal} removeCategory={c => {
        const used = ledger.entries.some(e => e.category_id === c.id) || (ledger.goals ?? []).some(g => g.category_id === c.id) || (ledger.subcategories ?? []).some(s => s.category_id === c.id);
        setConfirmation({ title: used ? 'Archive this category?' : 'Delete this category?', actionLabel:used?'Archive category':'Delete category', message: used ? 'Archiving hides it from new entries and keeps its subcategories, history and goals intact.' : 'This unused category will be removed.', action: async () => {
          await mutate(() => removeCategory(c, used), { ...ledger, categories: used ? ledger.categories.map(x => x.id === c.id ? { ...x, archived: true } : x) : ledger.categories.filter(x => x.id !== c.id) }, used ? 'Category archived. History preserved.' : 'Category deleted.');
        }});
      }} removeSubcategory={s => {
        const used = ledger.entries.some(e => e.subcategory_id === s.id);
        setConfirmation({ title: used ? 'Archive this subcategory?' : 'Delete this subcategory?', actionLabel:used?'Archive subcategory':'Delete subcategory', message: used ? 'It will be hidden from new entries while past entries keep their detail.' : 'This unused subcategory will be removed.', action: async () => {
          await mutate(() => removeSubcategory(s, used), { ...ledger, subcategories: used ? (ledger.subcategories ?? []).map(x => x.id === s.id ? { ...x, archived: true } : x) : (ledger.subcategories ?? []).filter(x => x.id !== s.id) }, used ? 'Subcategory archived. History preserved.' : 'Subcategory deleted.');
        }});
      }}/>}
      {goalContext && <div hidden={tab !== 'plan'} className="goals-workspace"><div className="goal-currency-control"><label>Goal currency<select aria-label="Goal currency" value={goalContext.currency} disabled={busy} onChange={e=>{const next=e.target.value as Currency;const switchCurrency=async()=>{setGoalDraftDirty(false);setEmergencyDraftDirty(false);setGoalContext({...goalContext,currency:next});};if(planningDirty)setConfirmation({title:"Switch goal currency?",message:"Unsaved goal edits will be discarded. Your selected month and saved plans stay unchanged.",actionLabel:"Discard and switch",action:switchCurrency});else void switchCurrency();}}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label><p className="small muted">Each currency has its own monthly goals. Your month stays selected. Saving selects this month and currency in your reports.</p></div><GoalsEditor key={goalContext.currency} onDirtyChange={setGoalDraftDirty} onPeriodChange={period=>setGoalContext({...goalContext,period})} ledger={reportingLedger(ledger,goalContext.currency)} busy={busy} save={storeGoals} initialPeriod={goalContext.period}><EmergencySettings onDirtyChange={setEmergencyDraftDirty} ledger={reportingLedger(ledger,ledger.profile.planning_currency ?? ledger.profile.currency)} busy={busy} save={async profile => mutate(() => saveProfile({...profile,currency:ledger.profile.currency}), { ...ledger, profile:{...profile,currency:ledger.profile.currency} }, 'Emergency fund updated.')}/></GoalsEditor><p className="small muted">{planningDirty?'Unsaved plan · Your draft stays here when you visit other tabs. Save before signing out.':'Your selected goal month is kept when you visit other tabs.'}</p></div>}
      {tab === 'admin' && isAdmin && !demo && <AdminPanel/>}
      {tab === 'settings' && <>{isAdmin&&!demo&&<section className="panel settings-panel"><h2>Administration</h2><p>Review signups and recent activity, or handle verified account-deletion requests.</p><button className="button secondary" onClick={()=>navigate('admin')}>Open admin panel</button></section>}<SettingsForm ledger={ledger} busy={busy} logout={signOut} save={async profile => mutate(() => saveProfile(profile), { ...ledger, profile }, 'Settings updated.')}/><section className="panel settings-panel account-control"><h2>Account & support</h2><p>Keep a copy of your records or contact the operator about your account.</p><button className="button secondary" disabled={busy} onClick={()=>exportExcel(true)}>Export all records</button><a className="button secondary" href="mailto:salman.se95@gmail.com?subject=PaisaTrace%20support">Contact support</a><a className="text-button" href="mailto:salman.se95@gmail.com?subject=PaisaTrace%20account%20deletion%20request">Request account deletion</a><p className="small muted">Deletion requests are handled by email after ownership verification. Request status is shared by email. Signing out keeps your records.</p></section>{!demo && <PasswordForm/>}</>}
      <PublicLinks/>
    </main>
    {batchModal&&<ExpenseBatchForm ledger={ledger} busy={busy} close={()=>setBatchModal(false)} save={storeExpenseBatch}/>}
    {entryModal && <EntryForm ledger={ledger} entry={entryModal} initialKind={newEntryKind} busy={busy} close={() => setEntryModal(null)} save={async (entry,custom,keepOpen) => {const saved=await storeEntry(entry,entryModal !== 'new',custom);if(!keepOpen)setEntryModal(null);return saved;}}/ >}
    {categoryModal && <CategoryForm category={categoryModal} ledger={ledger} busy={busy} close={() => setCategoryModal(null)} save={async category => { await mutate(() => saveCategory(category, categoryModal !== 'new'), { ...ledger, categories: categoryModal === 'new' ? [...ledger.categories, category] : ledger.categories.map(x => x.id === category.id ? category : x) }, 'Category saved.'); setCategoryModal(null); }}/ >}
    {subcategoryModal && <SubcategoryForm ledger={ledger} initial={subcategoryModal} busy={busy} close={() => setSubcategoryModal(null)} save={async subcategory => { const editing = 'id' in subcategoryModal; await mutate(() => saveSubcategory(subcategory, editing), { ...ledger, subcategories: editing ? (ledger.subcategories ?? []).map(x => x.id === subcategory.id ? subcategory : x) : [...(ledger.subcategories ?? []), subcategory] }, 'Subcategory saved.'); setSubcategoryModal(null); }}/ >}
    {confirmation && <Confirm key={confirmation.title} title={confirmation.title} message={confirmation.message} actionLabel={confirmation.actionLabel} entry={confirmation.entry} ledger={ledger} busy={busy} close={() => setConfirmation(null)} action={async () => { await confirmation.action(); setConfirmation(null); }}/ >}
  </div>;
}

function EntryTable({ entries, ledger, edit, remove, busy }: { entries: Entry[]; ledger: Ledger; edit: (e: Entry) => void; remove: (e: Entry) => void; busy: boolean }) {
  const [openActions,setOpenActions]=useState<string|null>(null);
  useEffect(()=>setOpenActions(null),[entries]);
  return <div className="transaction-list" role="table" aria-label="Transactions"><div className="transaction-head" role="row"><span role="columnheader">Entry</span><span role="columnheader">Date</span><span role="columnheader">Type</span><span role="columnheader">Amount</span><span role="columnheader" className="sr-only">Actions</span></div>{entries.map(e=>{const c=ledger.categories.find(c=>c.id===e.category_id)!;const sub=(ledger.subcategories??[]).find(s=>s.id===e.subcategory_id);const Icon=icons[c.kind];const formatted=money(e.amount_minor,e.currency);const number=formatted.replace(/^[^0-9]+/,'');const prefix=formatted.slice(0,formatted.length-number.length).trim();return <div className="transaction-row" role="row" key={e.id}>
    <div className="transaction-description" role="cell"><span className={`kind-icon ${c.kind}`}><Icon size={18}/></span><div><strong>{sub?.name??c.name}{sub?.archived||c.archived?' · archived':''}</strong>{sub&&<span className="transaction-parent">{c.name}</span>}{c.kind==='expense'&&<span className="transaction-payment">{e.payment_method??'Payment not specified'}</span>}{e.notes&&<span className="transaction-note">{e.notes}</span>}<span className="transaction-mobile-meta">{dateLabel(e.date)} · {e.withdrawal?'Withdrawal':kindLabels[c.kind]}</span></div></div>
    <span className="transaction-date" role="cell">{dateLabel(e.date)}</span><span className="transaction-type" role="cell"><span className={`badge ${c.kind}`}>{e.withdrawal?'Withdrawal':kindLabels[c.kind]}</span></span><strong className="transaction-amount" role="cell"><span>{e.withdrawal?'−':''}{prefix}</span>{' '}<span className={number.length>14?'transaction-number long':'transaction-number'}>{number}</span></strong>
    <div className="transaction-actions" role="cell"><button type="button" className="icon-button transaction-menu-toggle" aria-label={`Actions for ${sub?.name??c.name} ${e.date}`} aria-expanded={openActions===e.id} aria-controls={`entry-actions-${e.id}`} onClick={()=>setOpenActions(openActions===e.id?null:e.id)}>•••</button><div id={`entry-actions-${e.id}`} className={`transaction-action-buttons ${openActions===e.id?'is-open':''}`}><button className="icon-button" aria-label={`Edit entry ${c.name} ${e.date}`} disabled={busy} onClick={()=>{setOpenActions(null);edit(e);}}><Pencil size={15}/><span>Edit</span></button><button className="icon-button" aria-label={`Delete entry ${c.name} ${e.date}`} disabled={busy} onClick={()=>{setOpenActions(null);remove(e);}}><Trash2 size={15}/><span>Delete</span></button></div></div>
    </div>;})}</div>;
}
function EntryForm({ ledger, entry, initialKind = 'expense', busy, close, save }: { ledger: Ledger; entry: Entry | 'new'; initialKind?: Kind; busy: boolean; close: () => void; save: (e: Entry, custom?: {kind:Kind;name:string}, keepOpen?:boolean) => Promise<Entry> }) {
  const pending=useRef(false);const draftId=useRef(crypto.randomUUID());const [saveNotice,setSaveNotice]=useState('');
  const existing = entry === 'new' ? null : entry; const [kind, setKind] = useState<Kind>(existing ? ledger.categories.find(c => c.id === existing.category_id)!.kind : initialKind);
  const [category, setCategory] = useState(existing?.category_id ?? ''); const [subcategory, setSubcategory] = useState(existing?.subcategory_id ?? ''); const [date, setDate] = useState(existing?.date ?? today(ledger.profile.timezone)); const [currency, setCurrency] = useState<Currency>(existing?.currency ?? ledger.profile.currency); const [amount, setAmount] = useState(existing ? inputAmount(existing.amount_minor, existing.currency) : ''); const [notes, setNotes] = useState(existing?.notes ?? ''); const [withdrawal, setWithdrawal] = useState(existing?.withdrawal ?? false); const [error, setError] = useState('');
  const [payment,setPayment]=useState(existing?.payment_method??'');
  const [customName,setCustomName]=useState(''); const [customChoice,setCustomChoice]=useState(false);
  const entryOptions = categoryChoices(ledger, kind, existing);
  const suboptions = (ledger.subcategories ?? []).filter(s => s.category_id === category && (!s.archived || s.id === existing?.subcategory_id));
  async function submit(e: FormEvent) { e.preventDefault();if(pending.current||busy)return;pending.current=true;setError('');setSaveNotice(''); const keepOpen=(e.nativeEvent as SubmitEvent).submitter?.getAttribute('name')==='another'; try { if (!validDate(date)) throw new Error('Choose a valid date between 1900 and 2100.'); if(customChoice&&(!customName.trim()||customName.trim().length>60))throw new Error('Enter a category name between 1 and 60 characters.');if (!category && !customChoice) throw new Error('Add a category for this type first.'); const selected = ledger.categories.find(c => c.id === category)!; if (!customChoice && selected.archived && category !== existing?.category_id) throw new Error('Choose an active category.'); if (!customChoice && subcategory && !suboptions.some(s => s.id === subcategory)) throw new Error('Choose a subcategory in this category.'); const saved=await save({ id: existing?.id ?? draftId.current, user_id: ledger.profile.user_id, category_id: customChoice?'':category, subcategory_id:customChoice?null:subcategory || null, date, amount_minor: parseAmount(amount, currency), currency, notes: notes.trim(), payment_method:kind==='expense'?validatePaymentType(payment):null, withdrawal: (kind === 'saving' || kind === 'investment') && withdrawal },customChoice?{kind,name:customName.trim()}:undefined,keepOpen);if(keepOpen){draftId.current=crypto.randomUUID();setAmount('');setNotes('');setCustomChoice(false);setCustomName('');setCategory(saved.category_id);setSubcategory(saved.subcategory_id??'');setSaveNotice('Entry saved. Add the next one.');} } catch (e) { setError((e as Error).message); } finally{pending.current=false;} }
  return <Modal className="entry-dialog" title={existing ? 'Edit entry' : 'Add an entry'} close={() => { if (!busy) close(); }}><form onSubmit={submit} className="stack-form"><div className="entry-form-body"><fieldset disabled={busy} className="entry-form-fields"><fieldset className="kind-picker"><legend className="sr-only">Entry type</legend>{kinds.map(k => <label key={k} className={kind === k ? 'selected' : ''}><input type="radio" name="kind" value={k} checked={kind === k} onChange={() => { setKind(k); setCategory('');setSubcategory(''); setWithdrawal(false); setCustomChoice(false); setCustomName(''); }}/>{kindLabels[k]}</label>)}</fieldset><div className="form-grid"><div className="amount-field"><label>Amount<input inputMode="decimal" placeholder="0.00" required value={amount} onChange={e => setAmount(e.target.value)}/></label><AmountWords value={amount} currency={currency}/></div><label>Currency<select value={currency} onChange={e => setCurrency(e.target.value as Currency)}>{currencies.map(c => <option key={c}>{c}</option>)}</select></label></div><CategoryPicker ledger={ledger} choices={entryOptions} label="Category" required disabled={busy} value={customChoice?customCategoryChoice:subcategory || category} onChange={value=>{if(value===customCategoryChoice){setCustomChoice(true);return;}setCustomChoice(false);const selected=entryOptions.find(c=>c.value===value);setCategory(selected?.categoryId??'');setSubcategory(selected?.subcategoryId??'');}}/>{customChoice&&<label>Custom category name<input required maxLength={60} disabled={busy} value={customName} onChange={e=>setCustomName(e.target.value)} placeholder={kind==='income'?'e.g. Freelance work':kind==='saving'?'e.g. Car savings':kind==='investment'?'e.g. Retirement fund':'e.g. Office supplies'}/><span className="small muted">Saved under {kindLabels[kind].toLowerCase()} for future entries. Existing active names are reused.</span></label>}<label>Date<input type="date" min="1900-01-01" max="2100-12-31" required value={date} onChange={e => setDate(e.target.value)} onInput={e=>setDate(e.currentTarget.value)}/></label>{(kind === 'saving' || kind === 'investment') && <label>Movement<select value={withdrawal ? 'withdrawal' : 'contribution'} onChange={e => setWithdrawal(e.target.value === 'withdrawal')}><option value="contribution">Contribution</option><option value="withdrawal">Withdrawal</option></select></label>}<details className="entry-more-details"><summary>More details{payment||notes?' · Filled':''}</summary>{kind==='expense'&&<PaymentTypeField value={payment} onChange={setPayment}/>}<label>Note <span className="muted">(optional)</span><textarea rows={2} maxLength={500} placeholder="What was it for?" value={notes} onChange={e => setNotes(e.target.value)}/></label></details></fieldset><ErrorMessage message={error}/>{saveNotice&&<p role="status" className="goal-status favorable">{saveNotice}</p>}</div><div className="modal-actions entry-save-footer"><button type="button" className="button secondary" onClick={close} disabled={busy}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save entry'}</button>{!existing&&<button className="button secondary" name="another" disabled={busy}>Save & add another</button>}</div></form></Modal>;
}
function CategoryForm({ ledger, category, busy, close, save }: { ledger: Ledger; category: Category | 'new'; busy: boolean; close: () => void; save: (c: Category) => Promise<void> }) {
  const existing = category === 'new' ? null : category; const [name, setName] = useState(existing?.name ?? ''); const [kind, setKind] = useState<Kind>(existing?.kind ?? 'expense'); const [essential, setEssential] = useState(existing?.essential ?? false); const [isEmergency, setEmergency] = useState(existing?.emergency ?? false); const [archived, setArchived] = useState(existing?.archived ?? false); const [error, setError] = useState('');
  async function submit(e: FormEvent) { e.preventDefault(); setError(''); try { if (!name.trim()) throw new Error('Enter a category name.'); if (ledger.categories.some(c => c.id !== existing?.id && c.kind === kind && c.name.toLowerCase() === name.trim().toLowerCase())) throw new Error('A category with this name already exists in this type.'); await save({ id: existing?.id ?? crypto.randomUUID(), user_id: ledger.profile.user_id, name: name.trim(), kind, essential: kind === 'expense' && essential, emergency: kind === 'saving' && isEmergency, archived }); } catch (e) { setError((e as Error).message); } }
  return <Modal title={existing ? 'Edit category' : 'Add a category'} close={() => { if (!busy) close(); }}><form className="stack-form" onSubmit={submit}><label>Name<input required maxLength={60} placeholder="e.g. Groceries" value={name} onChange={e => setName(e.target.value)}/></label><label>Type<select value={kind} disabled={!!existing} onChange={e => setKind(e.target.value as Kind)}>{kinds.map(k => <option key={k} value={k}>{kindLabels[k]}</option>)}</select></label>{kind === 'expense' && <label className="checkbox-label"><input type="checkbox" checked={essential} onChange={e => setEssential(e.target.checked)}/>Essential expense</label>}{kind === 'saving' && <label className="checkbox-label"><input type="checkbox" checked={isEmergency} onChange={e => setEmergency(e.target.checked)}/>Count toward my emergency fund</label>}{existing?.archived && <label className="checkbox-label"><input type="checkbox" checked={!archived} onChange={e => setArchived(!e.target.checked)}/>Restore for new entries</label>}<ErrorMessage message={error}/><div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={close}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button></div></form></Modal>;
}
function SubcategoryForm({ ledger, initial, busy, close, save }: { ledger: Ledger; initial: Subcategory | { category_id: string }; busy: boolean; close: () => void; save: (s: Subcategory) => Promise<void> }) {
  const existing = 'id' in initial ? initial : null;
  const parent = ledger.categories.find(c => c.id === initial.category_id)!;
  const [name, setName] = useState(existing?.name ?? '');
  const [archived, setArchived] = useState(existing?.archived ?? false);
  const [isEmergency,setEmergency]=useState(existing?.emergency??false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try {
      const cleaned = name.trim();
      if (!cleaned) throw new Error('Enter a subcategory name.');
      if ((ledger.subcategories ?? []).some(s => s.id !== existing?.id && s.category_id === parent.id && s.name.toLowerCase() === cleaned.toLowerCase())) throw new Error('This subcategory already exists in '+parent.name+'.');
      await save({ id: existing?.id ?? crypto.randomUUID(), user_id: ledger.profile.user_id, category_id: parent.id, name: cleaned, archived, emergency: parent.kind==='saving'&&isEmergency });
    } catch (e) { setError((e as Error).message); }
  }
  return <Modal title={`${existing ? 'Edit' : 'Add'} subcategory in ${parent.name}`} close={() => { if (!busy) close(); }}><form className="stack-form" onSubmit={submit}><label>Subcategory name<input required maxLength={60} placeholder="e.g. Bills, Travel savings or Stocks" value={name} onChange={e => setName(e.target.value)}/></label><p className="small muted">Entries can be recorded in this subcategory. Entries count toward the {parent.name} total.</p>{parent.kind==='saving' && <label className="checkbox-label"><input type="checkbox" checked={isEmergency} onChange={e=>setEmergency(e.target.checked)}/>Count toward my emergency fund</label>}{existing?.archived && !parent.archived && <label className="checkbox-label"><input type="checkbox" checked={!archived} onChange={e => setArchived(!e.target.checked)}/>Restore for new entries</label>}<ErrorMessage message={error}/><div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={close}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save subcategory'}</button></div></form></Modal>;
}
function Confirm({ title, message, actionLabel='Confirm', entry, ledger, busy, close, action }: { title: string; message: string; actionLabel?:string; entry?:Entry; ledger:Ledger; busy: boolean; close: () => void; action: () => Promise<void> }) {
  const [error, setError] = useState(''); return <Modal title={title} close={() => { if (!busy) close(); }}><p>{message}</p>{entry && <dl className="entry-delete-details"><div><dt>Amount</dt><dd>{entry.withdrawal?'−':''}{money(entry.amount_minor,entry.currency)} · {entry.currency}</dd></div><div><dt>Category</dt><dd>{ledger.categories.find(c=>c.id===entry.category_id)?.name}{entry.subcategory_id?' → '+ledger.subcategories?.find(s=>s.id===entry.subcategory_id)?.name:''}</dd></div><div><dt>Date</dt><dd>{dateLabel(entry.date)}</dd></div><div><dt>Movement</dt><dd>{entry.withdrawal?'Withdrawal':kindLabels[ledger.categories.find(c=>c.id===entry.category_id)!.kind]}</dd></div>{ledger.categories.find(c=>c.id===entry.category_id)?.kind==='expense'&&<div><dt>Payment type</dt><dd>{entry.payment_method??'Not specified'}</dd></div>}<div><dt>Note</dt><dd>{entry.notes||'No note'}</dd></div></dl>}<ErrorMessage message={error}/><div className="modal-actions"><button className="button secondary" onClick={close} disabled={busy}>Cancel</button><button className="button danger" disabled={busy} onClick={async () => { try { await action(); } catch (e) { setError((e as Error).message); } }}>{busy ? 'Updating…' : actionLabel}</button></div></Modal>;
}
function EmergencySettings({ ledger, busy, save, onDirtyChange }: { ledger: Ledger; busy: boolean; save: (profile: Profile) => Promise<void>; onDirtyChange:(dirty:boolean)=>void }) {
  const [target, setTarget] = useState(inputAmount(ledger.profile.emergency_target, ledger.profile.currency)); const [error, setError] = useState(''); const fund = emergency(ledger);
  useEffect(()=>onDirtyChange(target!==inputAmount(ledger.profile.emergency_target,ledger.profile.currency)),[target,ledger.profile.emergency_target,ledger.profile.currency,onDirtyChange]);
  async function submit(e: FormEvent) { e.preventDefault(); setError(''); try { await save({...ledger.profile, emergency_target:parseAmount(target,ledger.profile.currency,true)}); } catch(e) { setError((e as Error).message); } }
  return <details className="category-budget-editor emergency-goal-settings"><summary>Emergency fund · {ledger.profile.currency} (optional)</summary><p className="small muted">A long-term cushion across all months. Contributions are part of savings. Mark a savings category as emergency fund to count its entries.</p><p>{money(fund.funded,ledger.profile.currency)} saved · {money(fund.gap,ledger.profile.currency)} remaining</p><form className="stack-form" onSubmit={submit}><div className="amount-field"><label>Emergency fund target<input inputMode="decimal" required disabled={busy} value={target} onChange={e=>setTarget(e.target.value)}/></label><AmountWords value={target} currency={ledger.profile.currency}/></div><ErrorMessage message={error}/><button className="button secondary" disabled={busy}>Save emergency target</button></form></details>;
}
function SettingsForm({ ledger, busy, save, logout }: { ledger: Ledger; busy: boolean; logout: () => Promise<void>; save: (p: Profile) => Promise<void> }) {
  const [currency,setCurrency]=useState(ledger.profile.currency);const [timezone,setTimezone]=useState(ledger.profile.timezone);const [error,setError]=useState('');const [review,setReview]=useState(false);
  const zones=[...new Set([ledger.profile.timezone,Intl.DateTimeFormat().resolvedOptions().timeZone,'UTC','Asia/Karachi','Asia/Dubai','Asia/Kolkata','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Australia/Sydney'])];
  async function persist(){try{await save(preferenceUpdate(ledger.profile,currency,timezone));setReview(false);}catch(e){setError((e as Error).message);}}
  async function submit(e:FormEvent){e.preventDefault();setError('');if(currency!==ledger.profile.currency){setReview(true);return;}await persist();}
  return <section className="panel settings-panel"><h2>Your preferences</h2><form className="stack-form" onSubmit={submit}><label>Default entry currency<select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label><p className="small muted">Used for new entries. Choose Reporting currency on Overview or Money Log to view another currency. Entries and plans are never converted or reset.</p><label>Timezone<select value={timezone} onChange={e=>setTimezone(e.target.value)}>{zones.map(z=><option key={z}>{z}</option>)}</select></label><p className="small muted">Used for today’s date and your default reporting month. Existing entry dates stay as recorded.</p><ErrorMessage message={error}/><button className="button" disabled={busy}>{busy?'Saving…':'Save settings'}</button><button type="button" className="button secondary" disabled={busy} onClick={logout}><LogOut size={17}/>Sign out</button></form>{review&&<Modal title="Change default entry currency?" close={()=>{if(!busy)setReview(false);}}><p>New entry forms will start in <strong>{currency}</strong> instead of {ledger.profile.currency}.</p><ul><li>{ledger.entries.length} existing records keep their amounts and currencies.</li><li>{(ledger.goals??[]).length} saved goal records keep their currency.</li><li>Earlier default targets and the emergency fund stay in {ledger.profile.planning_currency??ledger.profile.currency}.</li><li>Your reporting selection stays the same. No currency conversion takes place.</li></ul><ErrorMessage message={error}/><div className="modal-actions"><button className="button secondary" disabled={busy} onClick={()=>setReview(false)}>Cancel</button><button className="button" disabled={busy} onClick={persist}>{busy?'Saving…':'Confirm currency change'}</button></div></Modal>}</section>;
}

function PublicLinks() { return <footer className="public-links" aria-label="Legal and public information"><span className="powered-by">Powered by <a href="https://www.hirubix.com/" target="_blank" rel="noopener noreferrer">Rubix Labs</a></span><a href="/about.html">About PaisaTrace</a><a href="/privacy.html">Privacy policy</a><a href="/terms.html">Terms and conditions</a><a href="/guide.html" target="_blank" rel="noopener noreferrer">User guide ↗</a><a href="/third-party-notices.txt">Third-party notices</a></footer>; }
