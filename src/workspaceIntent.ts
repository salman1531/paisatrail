import {safeReturnPath} from './routes';
export type Workspace='personal'|'shared';
export const workspaceDestination=(workspace:Workspace)=>workspace==='shared'?'/shared/dashboard':'/app/overview';
export const workspaceAuthPath=(workspace:Workspace,mode='signup')=>`/${mode}?next=${encodeURIComponent(workspaceDestination(workspace))}`;
const key='paisatrace-workspace-intent';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const browserStore=()=>{try{return typeof window==='undefined'?undefined:window.localStorage;}catch{return undefined;}};
export function workspaceFromSearch(search:string):Workspace|null{const next=new URLSearchParams(search).get('next');return next==='/shared/dashboard'?'shared':next==='/app/overview'?'personal':null;}
/** No tokens or record identifiers: short-lived browser-local handoff to an email tab. */
export function saveWorkspaceIntent(workspace:Workspace,store:Store|undefined=browserStore(),now=Date.now()){try{store?.setItem(key,JSON.stringify({workspace,expires:now+3600000}));}catch{/* Same-tab safe return remains available. */}}
export function readWorkspaceIntent(store:Store|undefined=browserStore(),now=Date.now()):string|null{try{if(!store)return null;const value=JSON.parse(store.getItem(key)??'null');if(value&&['personal','shared'].includes(value.workspace)&&value.expires>now)return safeReturnPath(workspaceDestination(value.workspace));store.removeItem(key);}catch{}return null;}
export function clearWorkspaceIntent(store:Store|undefined=browserStore()){try{store?.removeItem(key);}catch{}}
