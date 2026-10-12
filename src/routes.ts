import {useSyncExternalStore} from 'react';
export const siteOrigin = 'https://paisatrace.hirubix.com';
export const workspacePages = {overview:'Overview', 'money-log':'Money Log', income:'Income', 'money-plan':'Money Plan', reports:'Reports', categories:'Categories', settings:'Settings', admin:'Administration'} as const;
export type Page = keyof typeof workspacePages;
export type Route = {area:'home'|'login'|'signup'|'forgot-password'|'callback'|'not-found'|'app'|'demo'; page?:Page; section?:'goals'|'spending'};
export function parseRoute(pathname:string,hash=''):Route {
  const path=pathname.replace(/\/+$/,'')||'/';
  const legacy=['#budgets','#spending'].includes(hash)?'spending':['#goals','#plan'].includes(hash)?'goals':undefined;
  if(path==='/'&&(legacy||hash==='#money-plan'))return {area:'app',page:'money-plan',section:legacy};
  if(path==='/')return {area:'home'};
  if(path==='/login')return {area:'login'};
  if(path==='/signup')return {area:'signup'};
  if(path==='/forgot-password')return {area:'forgot-password'};
  if(path==='/auth/callback')return {area:'callback'};
  const match=path.match(/^\/(app|demo)(?:\/([^/]+))?$/);
  if(match){const raw=match[2]||'overview';const section=raw==='budgets'?'spending':['goals','plan'].includes(raw)?'goals':legacy;const page=section?'money-plan':raw==='entries'?'money-log':raw;
    if(Object.prototype.hasOwnProperty.call(workspacePages,page)&&(match[1]!=='demo'||page!=='admin'))return {area:match[1] as 'app'|'demo',page:page as Page,section};
  }
  return {area:'not-found'};
}
export function workspacePath(page:string,demo=false){return `/${demo?'demo':'app'}/${page==='entries'?'money-log':page}`;}
// Return destinations are allow-listed private pages, never caller-supplied external URLs.
export function safeReturnPath(path:string|null){const [pathname,fragment]=(path||'').split('#');const route=parseRoute(pathname,fragment?'#'+fragment:'');return route.area==='app'?workspacePath(route.page!)+(route.section?'#'+route.section:''):'/app/overview';}
export function routeTitle(route:Route){if(route.area==='home')return 'PaisaTrace — Expense Tracker & Monthly Budget';const label=route.page?workspacePages[route.page]:({home:'Expense tracker & money planner',login:'Sign in',signup:'Create account','forgot-password':'Reset password',callback:'Confirm your account','not-found':'Page not found'} as const)[route.area as 'home'];return `${route.area==='demo'?'Demo · ':''}${label} · PaisaTrace`;}
export function moveTo(path:string,replace=false){if(location.pathname+location.search+location.hash===path)return;const [pathname,fragment]=path.split('#');document.title=routeTitle(parseRoute(pathname,fragment?'#'+fragment:''));history[replace?'replaceState':'pushState'](null,'',path);window.dispatchEvent(new Event('paisatrace-route'));}
const subscribe=(callback:()=>void)=>{window.addEventListener('popstate',callback);window.addEventListener('hashchange',callback);window.addEventListener('paisatrace-route',callback);return()=>{window.removeEventListener('popstate',callback);window.removeEventListener('hashchange',callback);window.removeEventListener('paisatrace-route',callback);};};
export function useRoute(){const locationKey=useSyncExternalStore(subscribe,()=>location.pathname+location.hash);const split=locationKey.indexOf('#');return parseRoute(split<0?locationKey:locationKey.slice(0,split),split<0?'':locationKey.slice(split));}
export function migratedOrigin(origin:string){return ['https://paisatrace.vercel.app','https://paisatrail-eight.vercel.app'].includes(origin)?siteOrigin:origin;}
