import ProductSwitcher,{ProductSwitchLink} from './ProductSwitcher';
import {pendingInvitation} from './shared/invitationContext';
import {defaultProductPath} from './shared/service';
import {financialAccountsEnabled} from './productFeatures';
import DisplaySettings from './DisplaySettings';
import {useDisplayPreferences,readDisplayPreferences} from './displayPreferences';
import UpcomingSummary from './UpcomingSummary';
import EntryDetails from './EntryDetails';
import AccountsPanel,{TransferForm} from './AccountsPanel';
import RecurringPanel from './RecurringPanel';
import {validateAccount,validateTransfer,accountBalance,matchingTransfers} from './accounts';
import {validateSchedule} from './recurring';
import {IncomeExpenseChart,MovementChart} from './ActivityCharts';
import BudgetProgress from './BudgetProgress';
import {APP_VERSION} from './version';
import BrandIdentity from './BrandIdentity';
import RecordingDiagnostics from './RecordingDiagnostics';
import {recordingMetric} from './recordingMetrics';
import {validateRecording,recordingSuccess} from './recording';
import RecoveryPanel from './RecoveryPanel';
import EntryForm from './EntryForm';
import RecordAction from './RecordAction';
import Modal from './Modal';
import Home from './Home';
import SiteFooter from './SiteFooter';
import {useRoute,moveTo,workspacePath,safeReturnPath,routeTitle,siteOrigin} from './routes';
import CategoryPicker from './CategoryPicker';
import CashFlowChart from './CashFlowChart';
import PaymentTypeField, {paymentTypes,validatePaymentType} from './PaymentTypeField';
import AdminPanel from './AdminPanel';
import EmailCallback from './EmailCallback';
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Download, LogOut, Pencil, PiggyBank, Plus, Search, Settings, ShieldCheck, Tags, Trash2, TrendingUp, UserRound, Wallet, LayoutDashboard, ReceiptText, Target, Eye, EyeOff, CircleHelp } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { configured, supabase, emailCallback, consumeEmailCallback, loadLedger, saveEntries, saveEntry, deleteEntry, restoreEntry, matchExpectedReceipt, saveCategory, removeCategory, saveSubcategory, removeSubcategory, saveProfile, saveIncomeSource, saveExpectedPayment, saveSpendingBudget, saveNamedGoal, saveBudgetCycle,saveAccount,saveTransfer,setTransferRemoved,saveSchedule,recordOccurrence } from './api';
import { newDemo, persistDemo, readDemo } from './demo';
import AnalysisScope from './AnalysisScope';
import ActiveFilterChips,{type ActiveFilter} from './ActiveFilterChips';
import MoneyPlan,{type MoneyPlanSection} from './MoneyPlan';
import {entryMatchesView} from './reviewLogic';
import { categoryChoices, customCategoryChoice, namedCategory } from './expenseChoices';
import BrandMark from './BrandMark';
import AmountWords from './AmountWords';
import { Login, PasswordForm } from './Auth';
import { reportingLedger, preferenceUpdate } from './reporting';
import OverviewSummary,{OverviewGoals} from './OverviewSummary';
import {type DrillScope} from './BudgetDashboard';
import CategoriesPanel from './CategoriesPanel';
import ExpenseBatchForm, {type ExpenseSubmission} from './ExpenseBatchForm';
import ReportPeriod,{reportPeriodLabel} from './ReportPeriod';
import {reconcileEntries} from './entryBatch';
import OverviewInsights from './OverviewInsights';
import MoneyValue from './MoneyValue';
import {IncomePanel,CycleSettings,PlanningPeriodSelector} from './PlanningPanels';
import {periodForDate,periodFilter,validatePlanningEntry,goalProgress,validateAllocations,paymentProgress} from './planning';
import { dateLabel, filtered, inputAmount, kindLabels, money, parseAmount, today, totals, validDate } from './finance';
import { currencies, kinds, type Category, type Subcategory, type Currency, type Entry, type Filter, type Kind, type Ledger, type IncomeSource,type ExpectedPayment,type SpendingBudget,type BudgetAllocation,type NamedGoal,type BudgetCycle,type Profile,type Account,type AccountTransfer,type RecurringSchedule } from './types';
const icons = { expense: Wallet, saving: PiggyBank, investment: TrendingUp, income: ArrowDownLeft };

function PageLoader() { return <div className="loading" role="status" aria-live="polite" aria-busy="true"><BrandMark/><span className="loading-spinner" aria-hidden="true"/><h2>Opening your ledger…</h2><p>Loading your account and financial overview.</p></div>; }
function ErrorMessage({ message }: { message: string }) { return message ? <p className="form-error" role="alert">{message}</p> : null; }

export default function App() {
  const route=useRoute();
  const [user, setUser] = useState<User | null>(null); const [authLoading, setAuthLoading] = useState(configured); const demo=route.area==='demo';
  const [callbackPending,setCallbackPending]=useState(Boolean(emailCallback));
  const [isAdmin,setIsAdmin]=useState(false);
  const [dashboardAccount,setDashboardAccount]=useState('all');
  const [detailEntry,setDetailEntry]=useState<Entry|null>(null);
  const [transferModal,setTransferModal]=useState<AccountTransfer|'new'|null>(null),[recurringSeed,setRecurringSeed]=useState<{schedule:RecurringSchedule;date:string}|null>(null);
  const [entryAccount,setEntryAccount]=useState('all');
  const [hiddenAmounts,setHiddenAmounts]=useState(()=>readDisplayPreferences().hideOnOpen),[logLimit,setLogLimit]=useState(50);

  const identity = useRef<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(()=>sessionStorage.getItem('paisatrail-password-recovery')==='true');
  function finishRecovery() { sessionStorage.removeItem('paisatrail-password-recovery'); setPasswordRecovery(false); }
  const [ledger, setLedger] = useState<Ledger | null>(null); const [ledgerScope,setLedgerScope]=useState<string|null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const requestedTab=route.page==='money-log'?'entries':route.page??'overview';
  const [planSection,setPlanSection]=useState<{name:MoneyPlanSection;request:number}|undefined>();
  const tab = requestedTab === 'admin' && (!user || demo || !isAdmin) ? 'overview' : requestedTab; const [filter, setFilter] = useState<Filter>({ year: today().slice(0, 4), month: today().slice(5, 7), category: 'all' }); const [search, setSearch] = useState('');
  const [logDateFilter,setLogDateFilter]=useState<Filter|null>(null);
  const [savedOutside,setSavedOutside]=useState<Entry|null>(null);
  const [entryCategory,setEntryCategory]=useState('all');
  const [entryPayment,setEntryPayment]=useState('all');
  const [entryKind,setEntryKind]=useState<Kind|'all'|'transfer'>('all');
  const [entrySubcategory,setEntrySubcategory]=useState('');
  const [batchModal,setBatchModal]=useState(false);
  const [entryCurrency,setEntryCurrency]=useState<Currency | 'all'>('all');
  const [periodDate,setPeriodDate]=useState(today());const [calendarMode,setCalendarMode]=useState(false);
  const [entrySeed,setEntrySeed]=useState<Partial<Entry>|undefined>();
  const [reportCurrency,setReportCurrency]=useState<Currency | null>(null);
  useEffect(()=>setLogLimit(50),[search,entryCategory,entryKind,entryCurrency,entryPayment,entryAccount,entrySubcategory,filter,logDateFilter]);
  const entrySaving = useRef(false);
  const [newEntryKind, setNewEntryKind] = useState<Kind>('expense');
  function openNewEntry(kind: Kind = 'expense',seed?:Partial<Entry>) { setHiddenAmounts(false);setRecurringSeed(null); recordingMetric('started'); setNewEntryKind(kind);setEntrySeed(seed); setEntryModal('new'); }
  const [entryModal, setEntryModal] = useState<Entry | 'new' | null>(null); const [categoryModal, setCategoryModal] = useState<Category | 'new' | null>(null); const [subcategoryModal, setSubcategoryModal] = useState<Subcategory | { category_id: string } | null>(null); const [confirmation, setConfirmation] = useState<{ title: string; message: string; actionLabel?: string; entry?: Entry; action: () => Promise<void> } | null>(null);

  function resetWorkspace() {
    setDashboardAccount('all');setDetailEntry(null);setTransferModal(null);setRecurringSeed(null);setEntryAccount('all');setLogDateFilter(null);setSavedOutside(null);setPeriodDate(today());setCalendarMode(false);setEntrySeed(undefined);
    setIsAdmin(false); setEntryKind('all');setEntryPayment('all');setEntrySubcategory('');setBatchModal(false);setSearch(''); setEntryCategory('all'); setEntryCurrency('all'); setReportCurrency(null);
    setEntryModal(null); setCategoryModal(null); setSubcategoryModal(null); setConfirmation(null); setNotice('');
    setFilter({year:today().slice(0,4),month:today().slice(5,7),category:'all'});
  }
  function navigate(next: string) {
    const legacy=next==='budgets'?'spending':next==='plan'||next==='goals'?'goals':undefined;const destination=legacy?'money-plan':next;
    if(legacy)setPlanSection(old=>({name:legacy,request:(old?.request??0)+1}));else if(destination==='money-plan')setPlanSection(undefined);
    moveTo(workspacePath(destination,demo));if(destination!==requestedTab)window.scrollTo({top:0,behavior:'instant'});
  }
  useEffect(()=>{
    document.title=routeTitle(route);
    const indexable=route.area==='home'&&(import.meta.env.VITE_PUBLIC_POLICY_REVIEWED??import.meta.env.VITE_POLICY_REVIEWED)==='true';
    let robots=document.querySelector<HTMLMetaElement>('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.append(robots);}robots.content=indexable?'index, follow':'noindex, follow';
    let canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}canonical.href=siteOrigin+(route.area==='home'?'/':location.pathname);
    if(route.section)setPlanSection(old=>({name:route.section!,request:(old?.request??0)+1}));
    if(route.area==='demo'||route.area==='app'){const target=workspacePath(requestedTab,route.area==='demo')+(route.section?'#'+route.section:'');if(location.pathname+location.hash!==target)moveTo(target,true);}
  },[route.area,route.page,route.section]);
  useEffect(()=>{
    if(authLoading||callbackPending)return;
    if(passwordRecovery){if(user&&route.area!=='callback')moveTo('/auth/callback',true);return;}
    if(route.area==='callback'&&!user)moveTo('/login',true);
    if(route.area==='app'&&!user){sessionStorage.setItem('paisatrace-return-route',safeReturnPath(workspacePath(requestedTab)+(route.section?'#'+route.section:'')));moveTo('/login',true);}
    if(user&&['login','signup','forgot-password','callback'].includes(route.area)){const saved=pendingInvitation()??sessionStorage.getItem('paisatrace-return-route');sessionStorage.removeItem('paisatrace-return-route');if(saved)moveTo(safeReturnPath(saved),true);else void defaultProductPath().then(path=>moveTo(path,true));}
  },[route.area,user,authLoading,callbackPending,passwordRecovery]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    function updateIdentity(next: User | null) { if (!alive) return; if (identity.current !== (next?.id ?? null)) { identity.current = next?.id ?? null; setLedger(null); resetWorkspace(); } setUser(next); setAuthLoading(false); }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY') { sessionStorage.setItem('paisatrail-password-recovery', 'true'); setPasswordRecovery(true); } if (event === 'SIGNED_OUT') finishRecovery(); updateIdentity(session?.user ?? null); });
    supabase.auth.getSession().then(({ data, error }) => { updateIdentity(data.session?.user ?? null); if (alive && error) setError(error.message); }).catch(e => { if (alive) { setError(String(e)); setAuthLoading(false); } });
    const callbackError = new URLSearchParams(location.hash.slice(1)).get('error_description'); if (callbackError) { setError(callbackError.replace(/\+/g, ' ')); history.replaceState(null, '', location.pathname); }
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (callbackPending) return;
    if (demo) { const sample={...readDemo(),accountsSupported:true};setLedger(sample);setLedgerScope('demo');setReportCurrency(sample.profile.currency);const date=today(sample.profile.timezone);setPeriodDate(date);setFilter(periodFilter(periodForDate(date,sample.budgetCycles))); return; }
    if (!user||route.area!=='app') { setLedger(null); return; }
    let alive = true; setBusy(true); setError('');
    loadLedger(user.id).then(v => { if (alive) { setLedger(v); setLedgerScope(user!.id); setReportCurrency(v.profile.currency); const date = today(v.profile.timezone); setPeriodDate(date);setFilter(periodFilter(periodForDate(date,v.budgetCycles))); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [user?.id, demo, callbackPending,route.area]);
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
  if(callbackPending&&emailCallback) return <EmailCallback callback={emailCallback} accepted={()=>{if(emailCallback?.recovery){sessionStorage.setItem('paisatrail-password-recovery','true');setPasswordRecovery(true);}else finishRecovery();consumeEmailCallback();setCallbackPending(false);moveTo('/auth/callback',true);}} cancel={()=>{consumeEmailCallback();setCallbackPending(false);moveTo('/login',true);}}/>;
  async function performSignOut() { setError(''); if (demo) { resetWorkspace(); setLedger(null); moveTo('/login'); return; } const r = await supabase?.auth.signOut(); if (r?.error) throw new Error(r.error.message); resetWorkspace(); setUser(null); setLedger(null); moveTo('/login'); }
  async function signOut() {
    try{await performSignOut();}catch(e){setError((e as Error).message);}
  }
  if(route.area==='home')return <Home/>;
  if(route.area==='not-found')return <main className="route-error"><BrandIdentity/><h1>Page not found</h1><p>This address does not match a PaisaTrace page.</p><a className="button" href="/">Go home</a><SiteFooter workspace/></main>;
  if (authLoading) return <PageLoader/>;
  if (user && passwordRecovery) return <main className="recovery-shell"><BrandIdentity/><PasswordForm recovery done={finishRecovery}/><button className="text-button" onClick={signOut}>Sign out</button><SiteFooter workspace/></main>;
  if (!demo && (!user||['login','signup','forgot-password','callback'].includes(route.area))) return <Login mode={route.area==='signup'?'signup':route.area==='forgot-password'?'reset':'signin'} changeRoute={moveTo} enterDemo={() => { resetWorkspace(); setError(''); moveTo((sessionStorage.getItem('paisatrace-return-route')??'').startsWith('/shared')?'/shared-demo/dashboard':'/demo/overview'); }} authError={error} links={<SiteFooter compact/>}/>;
  if (ledger&&ledgerScope!==(demo?'demo':user?.id))return <PageLoader/>;
  if (!ledger && !error) return <PageLoader/>;
  if (!ledger) return <div className="loading"><BrandMark/><h2>{busy ? 'Opening your ledger…' : 'Could not open your ledger'}</h2><ErrorMessage message={error}/><button className="button" onClick={() => location.reload()}>Try again</button><button className="text-button" onClick={signOut}>Sign out</button></div>;
  const currency = reportCurrency ?? ledger.profile.currency;
  const report = reportingLedger(ledger,currency);
  const planningPeriod=periodForDate(periodDate,ledger.budgetCycles,calendarMode);
  function selectPeriod(date:string,calendar=calendarMode){setLogDateFilter(null);setPeriodDate(date);setCalendarMode(calendar);setFilter(periodFilter(periodForDate(date,ledger!.budgetCycles,calendar)));}
  const entryFilter={...(logDateFilter??filter),category:entryCategory,currency:entryCurrency,kind:entryKind,subcategory:entrySubcategory||undefined,payment:entryPayment,account:financialAccountsEnabled?entryAccount:'all',search};
  const recentEntries=filtered(ledger.entries,{...filter,account:financialAccountsEnabled?dashboardAccount:'all',category:'all',currency}).sort((a,b)=>b.date.localeCompare(a.date));

  const visible=ledger.entries.filter(e=>entryMatchesView(ledger,e,entryFilter,search)).sort((a,b)=>b.date.localeCompare(a.date));
  const activeFilterCount=[search.trim(),entryCategory!=='all',entryKind!=='all',entrySubcategory,entryPayment!=='all',entryCurrency!=='all',financialAccountsEnabled&&entryAccount!=='all'].filter(Boolean).length;
  const filterChips:ActiveFilter[]=[];
  if(financialAccountsEnabled&&entryAccount!=='all')filterChips.push({key:'account',label:entryAccount==='__unassigned__'?'Unassigned':ledger.accounts?.find(a=>a.id===entryAccount)?.name??'Account',remove:()=>setEntryAccount('all')});
  if(entryKind!=='all')filterChips.push({key:'kind',label:entryKind==='transfer'?'Transfers':kindLabels[entryKind],remove:()=>setEntryKind('all')});
  if(entryCurrency!=='all')filterChips.push({key:'currency',label:entryCurrency,remove:()=>setEntryCurrency('all')});
  if(entryCategory!=='all')filterChips.push({key:'category',label:ledger.categories.find(c=>c.id===entryCategory)?.name??'Category',remove:()=>setEntryCategory('all')});
  if(entrySubcategory)filterChips.push({key:'subcategory',label:entrySubcategory==='__none__'?'No subcategory':ledger.subcategories?.find(c=>c.id===entrySubcategory)?.name??'Subcategory',remove:()=>setEntrySubcategory('')});
  if(entryPayment!=='all')filterChips.push({key:'payment',label:entryPayment==='__unspecified__'?'Payment not specified':entryPayment,remove:()=>setEntryPayment('all')});
  if(search.trim())filterChips.push({key:'search',label:'Search: '+search.trim(),remove:()=>setSearch('')});
  function clearEntryFilters(){setEntryAccount('all');setSearch('');setEntryKind('all');setEntryPayment('all');setEntrySubcategory('');setEntryCategory('all');setEntryCurrency('all');}
  function viewSavedEntry(){if(!savedOutside)return;selectPeriod(savedOutside.date);clearEntryFilters();setEntryCurrency(savedOutside.currency);setSavedOutside(null);navigate('entries');}
  const transferRows=tab==='entries'?matchingTransfers(ledger,entryFilter,search):[];
  const listEntries=tab==='overview'?recentEntries:visible;
  const recordCount=listEntries.length+transferRows.length;
  const period = reportPeriodLabel(tab==='entries'?logDateFilter??filter:filter);const years=[...new Set([today().slice(0,4),filter.year,...ledger.entries.map(e=>e.date.slice(0,4))])].filter(y=>y!=='all').sort().reverse();
  async function exportExcel(all = false) {
    setBusy(true);setError('');
    try {
      const exportLedger=demo?ledger!:await loadLedger(user!.id);
      const scope:Filter=all?{year:'all',month:'all',category:'all'}:entryFilter;
      const records=exportLedger.entries.filter(e=>entryMatchesView(exportLedger,e,scope,all?'':search));
      const {downloadWorkbook}=await import('./export');
      await downloadWorkbook(exportLedger,records,scope);setNotice('Excel export downloaded.');
    } catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }

  async function storeEntry(entry: Entry, editing: boolean, custom?: {kind:Kind;name:string}) {
    if (entrySaving.current) throw new Error('Please wait for the current entry to finish saving.');
    entrySaving.current=true; setBusy(true);
    try {
      // Reload before creating a name so retrying a failed entry can reuse an already saved category.
      const source = custom && !demo ? await loadLedger(user!.id) : ledger!;
      const planned = custom ? namedCategory(source,custom.kind,custom.name,crypto.randomUUID()) : null;
      const saved = planned ? {...entry,category_id:planned.category.id,subcategory_id:null} : entry;
      validateRecording({...source,categories:planned?.isNew?[...source.categories,planned.category]:source.categories},saved);
      validatePlanningEntry({...source,categories:planned?.isNew?[...source.categories,planned.category]:source.categories},saved,editing);
      const next = {...source,categories:planned?.isNew?[...source.categories,planned.category]:source.categories,entries:editing?source.entries.map(e=>e.id===saved.id?saved:e):reconcileEntries([saved],source.entries.filter(e=>e.id===saved.id))?source.entries:[...source.entries,saved],...(recurringSeed?{occurrences:[...(source.occurrences??[]),{id:saved.id,user_id:saved.user_id,schedule_id:recurringSeed.schedule.id,scheduled_date:recurringSeed.date,entry_id:saved.id,status:'posted' as const}]}:{})};
      await mutate(async()=>{if(planned?.isNew)await saveCategory(planned.category,false);if(recurringSeed&&!editing)await recordOccurrence(recurringSeed.schedule.id,recurringSeed.date,saved);else await saveEntry(saved,editing);},next,recordingSuccess(next,saved,editing));
      const matches=tab==='entries'?entryMatchesView(next,saved,entryFilter,search):!!filtered([saved],{...filter,currency}).length;
      setSavedOutside(matches?null:saved); return saved;
    } finally {entrySaving.current=false;setBusy(false);}
  }
  function drillRecords(scope?:DrillScope) {setEntryAccount(financialAccountsEnabled&&tab==='overview'?dashboardAccount:'all');setLogDateFilter(null);
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
      const hidden=entries.find(e=>!entryMatchesView({...source,categories},e,entryFilter,search));setSavedOutside(hidden??null);
      setNotice(`${entries.length} expenses saved. Your current dates and filters are unchanged.`);
    } finally {entrySaving.current=false;setBusy(false);}
  }
  const replace=<T extends {id:string}>(rows:T[]|undefined,row:T)=>[...(rows??[]).filter(x=>x.id!==row.id),row];
  async function storeSource(row:IncomeSource,payment?:ExpectedPayment){await mutate(()=>saveIncomeSource(row,payment),{...ledger!,incomeSources:replace(ledger!.incomeSources,row),expectedPayments:payment?replace(ledger!.expectedPayments,payment):ledger!.expectedPayments},'Income source saved.');}
  async function storeInlineSource(row:IncomeSource,customName?:string){const source=demo?ledger!:await loadLedger(user!.id),planned=customName?namedCategory(source,'income',customName,crypto.randomUUID()):null,actual={...row,category_id:planned?.category.id??row.category_id};await mutate(async()=>{if(planned?.isNew)await saveCategory(planned.category,false);await saveIncomeSource(actual);},{...source,categories:planned?.isNew?[...source.categories,planned.category]:source.categories,incomeSources:replace(source.incomeSources,actual)},'Income source saved. No income recorded.');return actual;}
  async function storePayment(row:ExpectedPayment){await mutate(()=>saveExpectedPayment(row,!!ledger!.expectedPayments?.some(x=>x.id===row.id)),{...ledger!,expectedPayments:replace(ledger!.expectedPayments,row)},'Expectation saved. Actual income unchanged.');}
  async function storeBudget(row:SpendingBudget,items:BudgetAllocation[]){validateAllocations(ledger!,items,row.total_minor,row.currency);await mutate(()=>saveSpendingBudget(row,items),{...ledger!,spendingBudgets:replace(ledger!.spendingBudgets,row),budgetAllocations:[...(ledger!.budgetAllocations??[]).filter(x=>x.budget_id!==row.id),...items]},'Budget saved for this period.');}
  async function storeNamedGoal(row:NamedGoal,amount:number|null,legacyId?:string,entryIds:string[]=[]){if(goalProgress(ledger!,row).saved<0)throw Error('Starting savings cannot make progress negative.');const old=ledger!.contributionPlans?.find(x=>x.goal_id===row.id&&x.period_start===planningPeriod.start&&x.period_end===planningPeriod.end);if(legacyId&&ledger!.contributionPlans?.some(p=>p.legacy_goal_id===legacyId&&p.goal_id!==row.id))throw Error('This earlier savings plan already belongs to another goal.');const plans=(ledger!.contributionPlans??[]).filter(x=>!(x.goal_id===row.id&&x.period_start===planningPeriod.start&&x.period_end===planningPeriod.end));if(amount!==null)plans.push({id:old?.id??crypto.randomUUID(),user_id:row.user_id,goal_id:row.id,period_start:planningPeriod.start,period_end:planningPeriod.end,amount_minor:amount,legacy_goal_id:legacyId??old?.legacy_goal_id});const next={...ledger!,namedGoals:replace(ledger!.namedGoals,row),contributionPlans:plans,entries:ledger!.entries.map(e=>entryIds.includes(e.id)?{...e,named_goal_id:row.id}:e)};for(const id of entryIds){const original=ledger!.entries.find(e=>e.id===id);if(!original||original.named_goal_id&&original.named_goal_id!==row.id)throw Error('An entry is no longer eligible. Refresh before linking.');validatePlanningEntry(next,next.entries.find(e=>e.id===id)!,true);}await mutate(()=>saveNamedGoal(row,planningPeriod,amount,legacyId,entryIds),next,entryIds.length?'Goal saved and existing records linked. No new activity recorded.':'Goal saved. Recorded totals unchanged.');if(entryIds.length)recordingMetric('goal_linked');}
  async function storeCycle(row:BudgetCycle){await mutate(()=>saveBudgetCycle(row),{...ledger!,budgetCycles:replace(ledger!.budgetCycles,row)},'Future budget cycle scheduled.');}
  async function storeAccount(a:Account,editing:boolean){
    validateAccount(ledger!,a);
    await mutate(()=>saveAccount(a,editing),{...ledger!,accounts:editing?(ledger!.accounts??[]).map(x=>x.id===a.id?a:x):[...(ledger!.accounts??[]),a]},'Account saved.');
  }
  async function storeTransfer(t:AccountTransfer,allocation?:Entry){
    validateTransfer(ledger!,t);const existing=ledger!.transfers?.find(x=>x.id===t.id);let entries=ledger!.entries;
    if(allocation){validatePlanningEntry(ledger!,allocation);entries=replace(entries,allocation);}
    else if(existing?.allocation_entry_id)entries=entries.map(e=>e.id===existing.allocation_entry_id?{...e,amount_minor:t.amount_minor,date:t.date,notes:t.notes}:e);
    const next={...ledger!,entries,transfers:existing?(ledger!.transfers??[]).map(x=>x.id===t.id?t:x):[...(ledger!.transfers??[]),t]};
    if((next.namedGoals??[]).some(g=>goalProgress(next,g).saved<0))throw Error('This would make goal progress negative.');
    await mutate(()=>saveTransfer(t,allocation,!!existing),next,'Transfer saved. Income and expense totals are unchanged.');setTransferModal(null);
  }
  async function removeTransfer(t:AccountTransfer,removed:boolean){
    const allocation=ledger!.entries.find(e=>e.id===t.allocation_entry_id)??ledger!.removedEntries?.find(r=>r.id===t.allocation_entry_id)?.entry;
    const next={...ledger!,transfers:(ledger!.transfers??[]).map(x=>x.id===t.id?{...x,removed_at:removed?new Date().toISOString():null}:x),entries:removed?ledger!.entries.filter(e=>e.id!==t.allocation_entry_id):allocation?[...ledger!.entries,allocation]:ledger!.entries,removedEntries:removed&&allocation?[...(ledger!.removedEntries??[]),{id:allocation.id,user_id:allocation.user_id,category_id:allocation.category_id,entry:allocation,removed_at:new Date().toISOString()}]:(ledger!.removedEntries??[]).filter(r=>r.id!==t.allocation_entry_id)};
    if((next.namedGoals??[]).some(g=>goalProgress(next,g).saved<0))throw Error('Correct the goal withdrawal before removing its funding transfer.');
    await mutate(()=>setTransferRemoved(t.id,removed),next,removed?'Transfer removed. Restore it in Accounts.':'Transfer restored.');
  }
  async function storeSchedule(schedule:RecurringSchedule,editing:boolean){validateSchedule(ledger!,schedule,editing);await mutate(()=>saveSchedule(schedule,editing),{...ledger!,schedules:editing?(ledger!.schedules??[]).map(s=>s.id===schedule.id?schedule:s):[...(ledger!.schedules??[]),schedule]},'Schedule saved. No transaction has been recorded.');}
  function recurringPanel(kind?:'income'|'expense'){return <RecurringPanel ledger={ledger!} kind={kind} busy={busy} save={storeSchedule} confirm={(schedule,date)=>{openNewEntry(schedule.kind,{category_id:schedule.category_id,account_id:schedule.account_id,currency:schedule.currency,amount_minor:schedule.amount_minor,date:today(ledger!.profile.timezone),notes:schedule.name});setRecurringSeed({schedule,date});}} skip={async(schedule,date)=>mutate(()=>recordOccurrence(schedule.id,date),{...ledger!,occurrences:[...(ledger!.occurrences??[]),{id:crypto.randomUUID(),user_id:ledger!.profile.user_id,schedule_id:schedule.id,scheduled_date:date,entry_id:null,status:'skipped'}]},'Occurrence skipped. Actual totals are unchanged.')}/>;}
  function confirmDelete(e: Entry) { setConfirmation({ title: 'Remove this entry?', message: 'Remove this record from totals and reports? You can restore it from Removed entries in Money Log. Linked goal progress and expected receipts will recalculate.', actionLabel:'Remove entry', entry:e, action: async () => {const next={...ledger!,entries:ledger!.entries.filter(x=>x.id!==e.id)};if((next.namedGoals??[]).some(g=>goalProgress(next,g).saved<0))throw Error('Deleting this contribution would make goal savings negative. Correct the linked withdrawal first.');await mutate(() => deleteEntry(e.id, ledger!.profile.user_id), { ...ledger!, entries: ledger!.entries.filter(x => x.id !== e.id),removedEntries:[...(ledger!.removedEntries??[]),{id:e.id,user_id:e.user_id,category_id:e.category_id,subcategory_id:e.subcategory_id,entry:e,removed_at:new Date().toISOString()}] }, 'Entry removed. Restore it from Removed entries in Money Log.'); } }); }
  return <div className="app-shell workspace-v2"><a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="sidebar"><a className="brand" href={workspacePath('overview',demo)} onClick={e => { e.preventDefault(); navigate('overview'); }}><BrandIdentity/></a><div className="workspace-label">YOUR PERSONAL FINANCES</div><nav aria-label="Main navigation">{[{ id: 'overview', name: 'Overview', Icon: LayoutDashboard }, { id: 'entries', name: 'Money Log', Icon: ReceiptText }, { id: 'income', name: 'Income', Icon: ArrowDownLeft }, { id: 'money-plan', name: 'Money Plan', Icon: Target }].map(({ id, name, Icon }) => <button key={id} className={tab === id ? 'nav-item active' : 'nav-item'} onClick={() => { navigate(id); }} aria-label={name} title={name} aria-current={tab === id ? 'page' : undefined}><Icon size={19}/><span className={id==='entries'||id==='money-plan'?'nav-label-desktop':undefined}>{name}</span>{(id==='entries'||id==='money-plan')&&<span className="nav-label-mobile">{id==='entries'?'Money Log':'Plan'}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="secondary-navigation">{financialAccountsEnabled&&<button className="text-button" onClick={()=>navigate('accounts')}><Wallet size={18}/><span>Accounts</span></button>}<button className="text-button" aria-label="Categories" title="Categories" onClick={()=>navigate('categories')}><Tags size={18}/><span>Categories</span></button><button className="text-button" aria-label="Settings" title="Settings" onClick={()=>navigate('settings')}><Settings size={18}/><span>Settings</span></button></div><a className="sidebar-help" href="/guide"><CircleHelp size={18}/><span>Help & guide</span></a><div className="private-note"><ShieldCheck size={18}/><span>{demo ? 'Demo workspace' : 'Your own private space'}</span></div><div className="account"><div className="avatar">{demo ? 'D' : (user?.email?.[0] ?? 'U').toUpperCase()}</div><div><strong>{demo ? 'Demo account' : 'My account'}</strong><span title={user?.email}>{demo ? 'Sample data only' : user?.email}</span></div><button className="icon-button" aria-label={demo ? 'Exit demo' : 'Sign out'} onClick={signOut}><LogOut size={18}/></button></div></div></aside>
    <main id="main-content" tabIndex={-1} aria-labelledby="page-title" className={`main ${tab==='entries'?'money-log-page':tab==='money-plan'?'money-plan-layout':tab==='overview'?'overview-page':''}`}>
      <ProductSwitcher product="personal" demo={demo}/>
      {demo && <div className="demo-banner"><span><strong>Demo</strong> · Sample data only</span><label><span className="demo-currency-label">Sample</span><select aria-label="Demo scenario currency" title="Sample currency loads a different fictional dataset" value={ledger.profile.currency} onChange={e=>{const chosen=e.target.value as Currency;setConfirmation({title:"Load "+chosen+" demo?",message:"This discards any unsaved goal draft and replaces this browser’s sample changes with a fictional "+chosen+" scenario. Your real account is unchanged. These are independent samples, not currency conversions.",action:async()=>{const fresh={...newDemo(chosen),accountsSupported:true};persistDemo(fresh);resetWorkspace();setLedger(fresh);setReportCurrency(chosen);setSearch('');setEntryCategory('all');}});}}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label><button onClick={() => setConfirmation({ title: 'Reset demo?', message: 'Your changes to the sample data and any unsaved goal draft will be removed.', action: async () => { const fresh = {...newDemo(ledger.profile.currency),accountsSupported:true}; persistDemo(fresh); resetWorkspace();setLedger(fresh);setReportCurrency(fresh.profile.currency);setSearch('');setEntryCategory('all'); } })}>Reset demo</button><details className="demo-currency-help"><summary aria-label="About demo and reporting currencies" title="Currency help">?</summary><p><strong>Sample currency</strong> loads different fictional records and resets demo edits. <strong>Currency filter</strong> filters totals to that currency. It never converts amounts.</p></details></div>}
      <header className="page-header"><div><h1 id="page-title">{tab === 'overview' ? 'Overview' : tab === 'entries' ? 'Money Log' : tab === 'accounts' ? 'Accounts' : tab === 'categories' ? 'Categories' : tab === 'income'?'Income':tab === 'money-plan'?'Money Plan':tab === 'admin' ? 'Account administration' : 'Settings'}</h1>{tab==='entries'&&<p className="sr-only">Everything you earn, spend, and set aside.</p>}</div><div className="header-actions"><button className="icon-button privacy-toggle" aria-label={hiddenAmounts?'Show amounts':'Hide amounts'} aria-pressed={hiddenAmounts} onClick={()=>setHiddenAmounts(v=>!v)}>{hiddenAmounts?<EyeOff size={19}/>:<Eye size={19}/>}</button>{tab==='income'?<button className="button" disabled={busy} onClick={()=>openNewEntry('income')}><Plus size={18}/>Add income</button>:<RecordAction transfer={financialAccountsEnabled&&ledger.accountsSupported?()=>setTransferModal('new'):undefined} open={openNewEntry} busy={busy}/>}<details className="mobile-account-menu" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}><summary aria-label={demo?'Demo menu':'Account menu'} title={demo?'Demo menu':'Account menu'}><UserRound size={20}/></summary><div onClick={e=>{if((e.target as HTMLElement).closest('button,a'))e.currentTarget.closest('details')?.removeAttribute('open');}}><ProductSwitchLink product="personal" demo={demo}/>{financialAccountsEnabled&&<button className="text-button" onClick={()=>navigate('accounts')}>Accounts</button>}<button className="text-button" onClick={()=>navigate('settings')}>Settings</button><button className="text-button" onClick={()=>navigate('categories')}>Categories</button><a href="/guide">User guide</a><button className="text-button" onClick={signOut} disabled={busy}><LogOut size={17}/>{demo?'Exit demo':'Sign out'}</button></div></details></div></header>
      <ErrorMessage message={error}/>{notice && <div className="toast" role="status"><Check size={17}/>{notice}</div>}
      {['overview','income','money-plan'].includes(tab)&&<PlanningPeriodSelector ledger={ledger} period={planningPeriod} calendar={calendarMode} change={selectPeriod} changeMode={mode=>selectPeriod(periodDate,mode)} currency={currency} changeCurrency={c=>{setDashboardAccount('all');setReportCurrency(c);}}/>}
      {financialAccountsEnabled&&tab==='overview'&&ledger.accountsSupported&&!!ledger.accounts?.length&&<label className="dashboard-account-filter">Account<select value={dashboardAccount} onChange={e=>setDashboardAccount(e.target.value)}><option value="all">All accounts and unassigned</option><option value="__unassigned__">Unassigned records</option>{ledger.accounts.filter(a=>a.currency===currency).map(a=><option key={a.id} value={a.id}>{a.name}{a.archived?' · Archived':''}</option>)}</select></label>}
      {hiddenAmounts?<section className="privacy-placeholder"><EyeOff size={28}/><h2>Financial details are hidden</h2><p>Show amounts to review your records and reports.</p><button className="button secondary" onClick={()=>setHiddenAmounts(false)}>Show amounts</button></section>:<>
      {savedOutside&&['entries','overview','income','money-plan'].includes(tab)&&!(tab==='entries'?entryMatchesView(ledger,savedOutside,entryFilter,search):filtered([savedOutside],{...filter,currency}).length>0)&&<div className="entry-saved-scope" role="status"><p>Entry saved outside this view. Your dates and filters are unchanged.</p><button className="text-button" onClick={viewSavedEntry}>View entry</button><button className="text-button" onClick={()=>setSavedOutside(null)}>Dismiss</button></div>}
      {financialAccountsEnabled&&tab==='accounts'&&<><AccountsPanel activity={id=>{clearEntryFilters();setEntryAccount(id);setLogDateFilter({year:'all',month:'all',category:'all'});navigate('entries');}} ledger={ledger} busy={busy} save={storeAccount} transfer={setTransferModal} remove={removeTransfer}/>{recurringPanel()}</>}
      {tab==='income'&&<IncomePanel ledger={ledger} period={planningPeriod} currency={currency} busy={busy} entry={openNewEntry} saveSource={storeSource} savePayment={storePayment} matchReceipt={async(e,p)=>{const next={...e,expected_payment_id:p.id};validatePlanningEntry(ledger,next,true);await mutate(()=>matchExpectedReceipt(e.id,p.id),{...ledger,entries:ledger.entries.map(x=>x.id===e.id?next:x)},'Existing income matched. No new income recorded.');recordingMetric('receipt_matched');}} records={()=>drillRecords({kind:'income'})}/>}
      {tab==='income'&&recurringPanel('income')}
      {tab==='money-plan'&&<MoneyPlan ledger={ledger} period={planningPeriod} currency={currency} busy={busy} saveBudget={storeBudget} saveGoal={storeNamedGoal} entry={openNewEntry} section={planSection} changeCurrency={setReportCurrency} records={()=>drillRecords()}/>}
      {tab==='money-plan'&&recurringPanel('expense')}

      {(tab === 'overview' || tab === 'entries') && <>
      {tab === 'overview' && <><OverviewSummary ledger={report} filter={{...filter,account:financialAccountsEnabled?dashboardAccount:'all'}} busy={busy} addExpense={()=>openNewEntry()} editGoals={()=>navigate('budgets')} details={kind=>drillRecords(kind?{kind}:undefined)}/><div className="dashboard-grid"><IncomeExpenseChart ledger={report} filter={{...filter,account:financialAccountsEnabled?dashboardAccount:'all'}} records={(kind,dates)=>{drillRecords(kind?{kind}:undefined);if(dates)setLogDateFilter(dates);}}/><CashFlowChart ledger={report} filter={{...filter,account:financialAccountsEnabled?dashboardAccount:'all'}} drill={drillRecords}/><MovementChart forceMovement={!financialAccountsEnabled} ledger={report} filter={{...filter,account:financialAccountsEnabled?dashboardAccount:'all'}}/><BudgetProgress ledger={report} period={planningPeriod} filter={{...filter,account:financialAccountsEnabled?dashboardAccount:'all'}} edit={()=>navigate('budgets')}/></div><UpcomingSummary ledger={report} period={planningPeriod} account={dashboardAccount} review={navigate}/><OverviewGoals ledger={report}/></>}
      {tab==='entries'&&<AnalysisScope currency={entryCurrency} currencyLabel="Entry currency" allowAllCurrencies changeCurrency={setEntryCurrency} ledger={ledger} period={planningPeriod} filter={logDateFilter} change={setLogDateFilter} changePeriod={selectPeriod}/>}
      <section className="panel entries-panel"><div className="panel-head"><div><h2>{tab==='overview'?<>Recent transactions<span className="count">{listEntries.length}</span></>:<>{entryKind==='all'?'Entries':entryKind==='transfer'?'Transfers':kindLabels[entryKind]}<span className="log-heading-count"> · {recordCount}</span></>}</h2>{tab==='overview'&&<p>{period} · All categories · {currency} only</p>}</div>{tab==='entries'&&<details className="log-secondary-actions"><summary>More actions</summary><div><button className="text-button" onClick={()=>setBatchModal(true)} disabled={busy}>Add multiple expenses</button><button className="text-button" onClick={()=>exportExcel()} disabled={busy}><Download size={16}/>Export Excel</button></div></details>}</div>{tab==='entries'&&<ActiveFilterChips filters={filterChips} clear={clearEntryFilters}/>}{tab==='entries'&&<div className="entry-type-filters" role="group" aria-label="Entry types">{(['all','expense','income','saving','investment',...(ledger.accountsSupported&&(financialAccountsEnabled||ledger.transfers?.length)?['transfer' as const]:[])] as const).map(k=><button className="text-button" key={k} aria-pressed={entryKind===k} onClick={()=>{setEntryKind(k);setEntryCategory('all');setEntrySubcategory('');}}>{k==='all'?'All':k==='transfer'?'Transfers':kindLabels[k]}</button>)}</div>}{tab==='entries'&&<div className="log-filter-toolbar"><label className="search-field"><Search size={16}/><input aria-label="Search entries" placeholder="Search entries" value={search} onChange={e=>setSearch(e.target.value)}/></label><details className="log-filter-disclosure"><summary>Filters{activeFilterCount>0&&<span className="count">{activeFilterCount}</span>}</summary><div className="entry-filters">{financialAccountsEnabled&&ledger.accountsSupported&&<label>Account<select value={entryAccount} onChange={e=>setEntryAccount(e.target.value)}><option value="all">All accounts</option><option value="__unassigned__">Unassigned</option>{(ledger.accounts??[]).map(a=><option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}</select></label>}<label>Category<select aria-label="Filter category" value={entryCategory} onChange={e=>{setEntryCategory(e.target.value);setEntrySubcategory('');}}><option value="all">All categories</option>{ledger.categories.filter(c=>entryKind==='all'||c.kind===entryKind).map(c=><option key={c.id} value={c.id}>{c.name}{c.archived?' (archived)':''}</option>)}</select></label><label>Entry type<select aria-label="Filter entry type" value={entryKind} onChange={e=>{setEntryKind(e.target.value as Kind|'all'|'transfer');setEntryCategory('all');setEntrySubcategory('');}}><option value="all">All entry types</option>{ledger.accountsSupported&&(financialAccountsEnabled||ledger.transfers?.length)&&<option value="transfer">Earlier transfers</option>}{kinds.map(k=><option key={k} value={k}>{kindLabels[k]}</option>)}</select></label><label>Payment<select aria-label="Filter payment type" value={entryPayment} onChange={e=>setEntryPayment(e.target.value)}><option value="all">All payment types</option><option value="__unspecified__">Not specified</option>{paymentTypes.map(p=><option key={p} value={p}>{p}</option>)}</select></label>{entrySubcategory&&<p>{entrySubcategory==='__none__'?'No subcategory':ledger.subcategories?.find(s=>s.id===entrySubcategory)?.name} only</p>}<p className="small muted">Filters apply to this list and its Excel export.</p></div></details></div>}{tab==='entries'&&transferRows.length>0&&<div className="log-transfers">{entryKind!=='transfer'&&<h3>Transfers · {transferRows.length}</h3>}<p className="small muted">Excluded from income and expense totals.</p><ul className="transfer-list">{transferRows.slice(0,logLimit).map(t=><li key={t.id}><div><strong>{financialAccountsEnabled?<>{ledger.accounts?.find(a=>a.id===t.from_account_id)?.name} → {ledger.accounts?.find(a=>a.id===t.to_account_id)?.name}</>:'Earlier internal transfer'}</strong><small>{t.date} · Transfer</small></div><MoneyValue amount={t.amount_minor} currency={t.currency}/><button className="text-button" onClick={()=>setTransferModal(t)}>Details</button></li>)}</ul></div>}{listEntries.length>0&&<EntryTable details={setDetailEntry} entries={tab === 'overview' ? listEntries.slice(0, 5) : listEntries.slice(0,logLimit)} ledger={ledger} edit={e=>{if(e.funding_transfer_id){const t=ledger.transfers?.find(t=>t.id===e.funding_transfer_id);if(t)setTransferModal(t);return;}recordingMetric('started');setEntryModal(e);}} remove={e=>{if(e.funding_transfer_id){const transfer=ledger.transfers?.find(t=>t.id===e.funding_transfer_id);if(transfer)setTransferModal(transfer);return;}confirmDelete(e);}} busy={busy}/>}{tab==='entries'&&Math.max(listEntries.length,transferRows.length)>logLimit&&<button className="view-all" onClick={()=>setLogLimit(n=>n+50)}>Show more records</button>}{listEntries.length === 0 && !(tab==='entries'&&matchingTransfers(ledger,entryFilter,search).length) && <div className="empty"><CalendarDays size={30}/><h3>{ledger.entries.length ? 'No entries match this view' : 'A fresh start for your money'}</h3><p>{ledger.entries.length ? 'Try a different month, category, entry currency or search.' : 'Start with income or your first expense. Goals are optional.'}</p>{tab==='overview'&&<button className="button secondary" onClick={() => openNewEntry()}><Plus size={17}/>Add entry</button>}</div>}{tab === 'overview' && <button className="view-all" onClick={() => drillRecords()}>View all transactions · {listEntries.length} {currency} entries</button>}</section>
      {tab==='overview'&&<OverviewInsights ledger={report} period={planningPeriod} calendar={calendarMode} account={dashboardAccount} records={dates=>{drillRecords();setEntryAccount(dates.account??'all');setLogDateFilter(dates);}}/>}
      <p className="page-foot">A clearer picture, one entry at a time.</p></>}
      {tab==='entries'&&<RecoveryPanel ledger={{...ledger,removedEntries:ledger.removedEntries?.filter(r=>!r.entry.funding_transfer_id)}} busy={busy} restore={async e=>{const c=ledger.categories.find(c=>c.id===e.category_id),sub=ledger.subcategories?.find(s=>s.id===e.subcategory_id);if(c?.archived||sub?.archived)throw Error('Restore the archived category in Categories first, then retry.');if(ledger.expectedPayments?.some(p=>p.id===e.expected_payment_id&&p.cancelled))throw Error('Reopen the cancelled expected payment first, then retry.');validatePlanningEntry(ledger,e);await mutate(()=>restoreEntry(e.id),{...ledger,entries:[...ledger.entries,e],removedEntries:ledger.removedEntries?.filter(r=>r.id!==e.id)},'Entry restored. Totals and linked progress updated.');}}/>}
      {tab === 'categories' && <CategoriesPanel ledger={ledger} addCategory={()=>setCategoryModal('new')} busy={busy} editCategory={setCategoryModal} editSubcategory={setSubcategoryModal} removeCategory={c => {
        const used = ledger.schedules?.some(x=>x.category_id===c.id)||ledger.incomeSources?.some(x=>x.category_id===c.id)||ledger.expectedPayments?.some(x=>x.category_id===c.id)||ledger.budgetAllocations?.some(x=>x.category_id===c.id)||[...ledger.entries,...(ledger.removedEntries??[]).map(r=>r.entry)].some(e => e.category_id === c.id) || (ledger.goals ?? []).some(g => g.category_id === c.id) || (ledger.subcategories ?? []).some(s => s.category_id === c.id);
        setConfirmation({ title: used ? 'Archive this category?' : 'Delete this category?', actionLabel:used?'Archive category':'Delete category', message: used ? 'Archiving hides it from new entries and keeps its subcategories, history and goals intact.' : 'This unused category will be removed.', action: async () => {
          await mutate(() => removeCategory(c, used), { ...ledger, categories: used ? ledger.categories.map(x => x.id === c.id ? { ...x, archived: true } : x) : ledger.categories.filter(x => x.id !== c.id) }, used ? 'Category archived. History preserved.' : 'Category deleted.');
        }});
      }} removeSubcategory={s => {
        const used = [...ledger.entries,...(ledger.removedEntries??[]).map(r=>r.entry)].some(e => e.subcategory_id === s.id)||!!ledger.budgetAllocations?.some(x=>x.subcategory_id===s.id);
        setConfirmation({ title: used ? 'Archive this subcategory?' : 'Delete this subcategory?', actionLabel:used?'Archive subcategory':'Delete subcategory', message: used ? 'It will be hidden from new entries while past entries keep their detail.' : 'This unused subcategory will be removed.', action: async () => {
          await mutate(() => removeSubcategory(s, used), { ...ledger, subcategories: used ? (ledger.subcategories ?? []).map(x => x.id === s.id ? { ...x, archived: true } : x) : (ledger.subcategories ?? []).filter(x => x.id !== s.id) }, used ? 'Subcategory archived. History preserved.' : 'Subcategory deleted.');
        }});
      }}/>}
      {tab === 'admin' && isAdmin && !demo && <AdminPanel/>}
      {tab === 'settings' && <div className="settings-groups"><section className="panel settings-panel"><h2>Application version</h2><strong>{APP_VERSION}</strong><p className="small muted">Your financial records are preserved across versions.</p></section><DisplaySettings/><RecordingDiagnostics/><SettingsForm ledger={ledger} busy={busy} logout={signOut} save={async profile => mutate(() => saveProfile(profile), { ...ledger, profile }, 'Settings updated.')}/><CycleSettings ledger={ledger} busy={busy} save={storeCycle}/><section className="panel settings-panel account-control"><h2>Profile & account</h2><p>Signed in as {demo?'Demo account':user?.email}</p><button className="button secondary" disabled={busy} onClick={()=>exportExcel(true)}>Export all records</button><a className="text-button" href="mailto:salman.se95@gmail.com?subject=PaisaTrace%20account%20deletion%20request">Request account deletion</a><p className="small muted">Deletion is handled by email after ownership verification. Status is shared by email.</p>{!demo&&<details className="account-password"><summary>Change password</summary><PasswordForm/></details>}</section><section className="panel settings-panel"><h2>Help</h2><a className="button secondary" href="/guide" target="_blank" rel="noopener noreferrer">User guide</a><a className="text-button" href="mailto:salman.se95@gmail.com?subject=PaisaTrace%20support">Contact support</a></section>{isAdmin&&!demo&&<section className="panel settings-panel"><h2>Administration</h2><button className="button secondary" onClick={()=>navigate('admin')}>Open admin panel</button></section>}</div>}
      </>}<SiteFooter workspace/>
    </main>
    {detailEntry&&<EntryDetails ledger={ledger} entry={detailEntry} close={()=>setDetailEntry(null)} edit={()=>{setDetailEntry(null);if(detailEntry.funding_transfer_id){const transfer=ledger.transfers?.find(t=>t.id===detailEntry.funding_transfer_id);if(transfer)setTransferModal(transfer);}else setEntryModal(detailEntry);}}/>}
    {transferModal&&<TransferForm ledger={ledger} initial={transferModal} busy={busy} close={()=>setTransferModal(null)} save={storeTransfer}/>}
    {batchModal&&<ExpenseBatchForm ledger={ledger} busy={busy} close={()=>setBatchModal(false)} save={storeExpenseBatch}/>}
    {entryModal && <EntryForm allowAnother={!recurringSeed} context={recurringSeed?`Confirm ${recurringSeed.schedule.name} · scheduled ${recurringSeed.date}. Set the actual amount and date. Only this occurrence will be recorded.`:undefined} saveSource={storeInlineSource} ledger={ledger} entry={entryModal} seed={entryModal==='new'?entrySeed:undefined} initialKind={newEntryKind} busy={busy} close={() => setEntryModal(null)} save={async (entry,custom,keepOpen) => {const saved=await storeEntry(entry,entryModal !== 'new',custom);if(!keepOpen)setEntryModal(null);return saved;}}/ >}
    {categoryModal && <CategoryForm category={categoryModal} ledger={ledger} busy={busy} close={() => setCategoryModal(null)} save={async category => { await mutate(() => saveCategory(category, categoryModal !== 'new'), { ...ledger, categories: categoryModal === 'new' ? [...ledger.categories, category] : ledger.categories.map(x => x.id === category.id ? category : x) }, 'Category saved.'); setCategoryModal(null); }}/ >}
    {subcategoryModal && <SubcategoryForm ledger={ledger} initial={subcategoryModal} busy={busy} close={() => setSubcategoryModal(null)} save={async subcategory => { const editing = 'id' in subcategoryModal; await mutate(() => saveSubcategory(subcategory, editing), { ...ledger, subcategories: editing ? (ledger.subcategories ?? []).map(x => x.id === subcategory.id ? subcategory : x) : [...(ledger.subcategories ?? []), subcategory] }, 'Subcategory saved.'); setSubcategoryModal(null); }}/ >}
    {confirmation && <Confirm key={confirmation.title} title={confirmation.title} message={confirmation.message} actionLabel={confirmation.actionLabel} entry={confirmation.entry} ledger={ledger} busy={busy} close={() => setConfirmation(null)} action={async () => { await confirmation.action(); setConfirmation(null); }}/ >}
  </div>;
}

function EntryNote({note}:{note:string}){
 const measure=useRef<HTMLSpanElement>(null),[clipped,setClipped]=useState(false);
 function update(){const element=measure.current;if(element&&!element.closest('details')?.open)setClipped(element.scrollWidth>element.clientWidth+1);}
 useLayoutEffect(()=>{const element=measure.current;if(!element)return;update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();},[note,clipped]);
 const copy=<span ref={measure} className="transaction-note-copy">{note}</span>;
 return <div className="transaction-note-block">{clipped?<details key={note} className="transaction-note-details" onToggle={update}><summary>{copy}</summary></details>:copy}</div>;
}

function EntryTable({ entries, ledger, edit, remove, busy, details }: { details:(e:Entry)=>void; entries: Entry[]; ledger: Ledger; edit: (e: Entry) => void; remove: (e: Entry) => void; busy: boolean }) {
 const display=useDisplayPreferences();
 const [openActions,setOpenActions]=useState<string|null>(null);
 useEffect(()=>setOpenActions(null),[entries]);
 const dates=[...new Set(entries.map(e=>e.date))].sort().reverse();
 return <div className="transaction-list grouped-transactions" role="table" aria-label="Transactions"><div className="sr-only" role="row"><span role="columnheader">Entry</span><span role="columnheader">Amount and type</span><span role="columnheader">Actions</span></div>{dates.map(date=><div role="rowgroup" key={date}><div className="transaction-date-group" role="row"><span role="cell" aria-colspan={3}>{dateLabel(date,display.dateFormat)}</span></div>{entries.filter(e=>e.date===date).map(e=>{const c=ledger.categories.find(c=>c.id===e.category_id)!;const sub=ledger.subcategories?.find(s=>s.id===e.subcategory_id);const Icon=icons[c.kind];const meta=[sub&&c.name!==kindLabels[c.kind]?c.name:'',c.kind==='expense'?e.payment_method:'',financialAccountsEnabled?(ledger.accounts?.find(a=>a.id===e.account_id)?.name??'Unassigned'):'',e.funding_transfer_id?'Goal allocation from transfer':'',e.income_source_id?'Source: '+ledger.incomeSources?.find(s=>s.id===e.income_source_id)?.name:'',e.named_goal_id?'Goal: '+ledger.namedGoals?.find(g=>g.id===e.named_goal_id)?.name:'',e.expected_payment_id?'Expected: '+ledger.expectedPayments?.find(p=>p.id===e.expected_payment_id)?.name:''].filter(Boolean).join(' · ');return <div className="transaction-row" role="row" key={e.id}>
 <div className="transaction-description" role="cell"><span className={`kind-icon ${c.kind}`}><Icon size={18}/></span><div><div className="transaction-heading"><button type="button" className="entry-title-button" onClick={()=>details(e)}>{sub?.name??c.name}{sub?.archived||c.archived?' · archived':''}</button>{meta&&<span className="transaction-context">{meta}</span>}</div>{e.notes&&<EntryNote note={e.notes}/>}</div></div>
 <div className="transaction-amount" role="cell"><strong><MoneyValue amount={e.withdrawal?-e.amount_minor:e.amount_minor} currency={e.currency}/></strong><span className={`badge ${c.kind}`}>{e.withdrawal?'Withdrawal':kindLabels[c.kind]}</span></div>
 <div className="transaction-actions" role="cell"><button type="button" className="icon-button transaction-menu-toggle" aria-label={`Actions for ${sub?.name??c.name} ${e.date}`} aria-expanded={openActions===e.id} aria-controls={`entry-actions-${e.id}`} onClick={()=>setOpenActions(openActions===e.id?null:e.id)}>•••</button><div id={`entry-actions-${e.id}`} className={`transaction-action-buttons ${openActions===e.id?'is-open':''}`}><button className="icon-button" aria-label={`Edit entry ${c.name} ${e.date}`} disabled={busy} onClick={()=>{setOpenActions(null);edit(e);}}><Pencil size={15}/><span>Edit</span></button><button className="icon-button" aria-label={`Remove entry ${c.name} ${e.date}`} disabled={busy} onClick={()=>{setOpenActions(null);remove(e);}}><Trash2 size={15}/><span>Remove</span></button></div></div>
 </div>;})}</div>)}</div>;
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
function SettingsForm({ ledger, busy, save, logout }: { ledger: Ledger; busy: boolean; logout: () => Promise<void>; save: (p: Profile) => Promise<void> }) {
  const [currency,setCurrency]=useState(ledger.profile.currency);const [timezone,setTimezone]=useState(ledger.profile.timezone);const [error,setError]=useState('');const [review,setReview]=useState(false);
  const zones=[...new Set([ledger.profile.timezone,Intl.DateTimeFormat().resolvedOptions().timeZone,'UTC','Asia/Karachi','Asia/Dubai','Asia/Kolkata','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Australia/Sydney'])];
  async function persist(){try{await save(preferenceUpdate(ledger.profile,currency,timezone));setReview(false);}catch(e){setError((e as Error).message);}}
  async function submit(e:FormEvent){e.preventDefault();setError('');if(currency!==ledger.profile.currency){setReview(true);return;}await persist();}
  return <section className="panel settings-panel"><h2>Preferences</h2><form className="stack-form" onSubmit={submit}><label>Default entry currency<select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label><label>Timezone<select value={timezone} onChange={e=>setTimezone(e.target.value)}>{zones.map(z=><option key={z}>{z}</option>)}</select></label><details className="context-help"><summary>About these preferences</summary><p>Currency defaults new entries; reporting currency is chosen separately. Timezone determines today’s date. Existing records and plans stay unchanged.</p></details><ErrorMessage message={error}/><button className="button" disabled={busy}>{busy?'Saving…':'Save settings'}</button><button type="button" className="button secondary" disabled={busy} onClick={logout}><LogOut size={17}/>Sign out</button></form>{review&&<Modal title="Change default entry currency?" close={()=>{if(!busy)setReview(false);}}><p>New entry forms will start in <strong>{currency}</strong> instead of {ledger.profile.currency}.</p><ul><li>{ledger.entries.length} existing records keep their amounts and currencies.</li><li>{(ledger.goals??[]).length} saved goal records keep their currency.</li><li>Earlier default targets and the emergency fund stay in {ledger.profile.planning_currency??ledger.profile.currency}.</li><li>Your reporting selection stays the same. No currency conversion takes place.</li></ul><ErrorMessage message={error}/><div className="modal-actions"><button className="button secondary" disabled={busy} onClick={()=>setReview(false)}>Cancel</button><button className="button" disabled={busy} onClick={persist}>{busy?'Saving…':'Confirm currency change'}</button></div></Modal>}</section>;
}
