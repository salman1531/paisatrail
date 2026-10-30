import type {SharedPage} from './shared/model';
import {useSyncExternalStore} from 'react';
export const siteOrigin = 'https://paisatrace.hirubix.com';
export const workspacePages = {overview:'Overview', 'money-log':'Money Log', income:'Income', 'money-plan':'Money Plan', accounts:'Accounts', categories:'Categories', settings:'Settings', admin:'Administration'} as const;
export type Page = keyof typeof workspacePages;
export type Route = {area:'home'|'personal-finance'|'shared-expenses'|'login'|'signup'|'forgot-password'|'callback'|'not-found'|'app'|'demo'|'products'|'shared'|'shared-demo'|'join'; sharedPage?:SharedPage;contextId?:string;inviteToken?:string;page?:Page; section?:'goals'|'spending'};
export function parseRoute(pathname:string,hash=''):Route {
  const path=pathname.replace(/\/+$/,'')||'/';
  const legacy=['#budgets','#spending'].includes(hash)?'spending':['#goals','#plan'].includes(hash)?'goals':undefined;
  if(path==='/'&&(legacy||hash==='#money-plan'))return {area:'app',page:'money-plan',section:legacy};
  if(path==='/')return {area:'home'};
  if(path==='/personal-finance')return {area:'personal-finance'};
  if(path==='/shared-expenses')return {area:'shared-expenses'};
  if(path==='/products')return {area:'products'};
  if(path==='/shared/join'){const token=new URLSearchParams(hash.replace(/^#/, '')).get('invite')??'';return {area:'join',inviteToken:/^[a-f0-9]{64}$/.test(token)?token:undefined};}
  const shared=path.match(/^\/(shared|shared-demo)(?:\/(dashboard|groups|friends|activity|settlements|reports|settings))?(?:\/([a-f0-9-]{36}))?$/);
  if(shared&&(!shared[3]||['groups','friends'].includes(shared[2])))return {area:shared[1] as 'shared'|'shared-demo',sharedPage:(shared[2]||'dashboard') as SharedPage,contextId:shared[3]};
  if(path==='/login')return {area:'login'};
  if(path==='/signup')return {area:'signup'};
  if(path==='/forgot-password')return {area:'forgot-password'};
  if(path==='/auth/callback')return {area:'callback'};
  const match=path.match(/^\/(app|demo)(?:\/([^/]+))?$/);
  if(match){const raw=match[2]||'overview';const section=raw==='budgets'?'spending':['goals','plan'].includes(raw)?'goals':legacy;const page=section?'money-plan':raw==='entries'?'money-log':raw==='reports'?'overview':raw==='accounts'?'money-log':raw;
    if(Object.prototype.hasOwnProperty.call(workspacePages,page)&&(match[1]!=='demo'||page!=='admin'))return {area:match[1] as 'app'|'demo',page:page as Page,section};
  }
  return {area:'not-found'};
}
export function workspacePath(page:string,demo=false){return `/${demo?'demo':'app'}/${page==='entries'?'money-log':page==='reports'?'overview':page==='accounts'?'money-log':page}`;}
// Return destinations are allow-listed private pages, never caller-supplied external URLs.
export function safeReturnPath(path:string|null){const [pathname,fragment]=(path||'').split('#');const route=parseRoute(pathname,fragment?'#'+fragment:'');if(route.area==='shared')return pathname; if(route.area==='join'&&route.inviteToken)return '/shared/join#invite='+route.inviteToken; if(route.area==='products')return '/products';return route.area==='app'?workspacePath(route.page!)+(route.section?'#'+route.section:''):'/app/overview';}
export function routeTitle(route:Route){if(route.area==='personal-finance')return 'Personal Finance — Expense Tracker & Budget Planner · PaisaTrace';if(route.area==='shared-expenses')return 'Shared Expenses — Split Costs & Track Repayments · PaisaTrace';if(route.area==='products')return 'Choose your workspace · PaisaTrace';if(['shared','shared-demo','join'].includes(route.area))return `${route.area==='shared-demo'?'Demo · ':''}${route.area==='join'?'Join a shared space':(route.sharedPage==='settlements'?'Repayments':!route.sharedPage||route.sharedPage==='dashboard'?'Overview':route.sharedPage.replace(/^./,c=>c.toUpperCase()))} · Shared Expenses · PaisaTrace`;if(route.area==='home')return 'PaisaTrace — Personal Finance & Shared Expenses';const label=route.page?workspacePages[route.page]:({home:'Expense tracker & money planner',login:'Sign in',signup:'Create account','forgot-password':'Reset password',callback:'Confirm your account','not-found':'Page not found'} as const)[route.area as 'home'];return `${route.area==='demo'?'Demo · ':''}${label} · PaisaTrace`;}
export function moveTo(path:string,replace=false){if(location.pathname+location.search+location.hash===path)return;const [pathname,fragment]=path.split('#');document.title=routeTitle(parseRoute(pathname.split('?')[0],fragment?'#'+fragment:''));history[replace?'replaceState':'pushState'](null,'',path);window.dispatchEvent(new Event('paisatrace-route'));}
const subscribe=(callback:()=>void)=>{window.addEventListener('popstate',callback);window.addEventListener('hashchange',callback);window.addEventListener('paisatrace-route',callback);return()=>{window.removeEventListener('popstate',callback);window.removeEventListener('hashchange',callback);window.removeEventListener('paisatrace-route',callback);};};
export function useRoute(){const locationKey=useSyncExternalStore(subscribe,()=>location.pathname+location.hash);const split=locationKey.indexOf('#');return parseRoute(split<0?locationKey:locationKey.slice(0,split),split<0?'':locationKey.slice(split));}
export function migratedOrigin(origin:string){return ['https://paisatrace.vercel.app','https://paisatrail-eight.vercel.app'].includes(origin)?siteOrigin:origin;}
