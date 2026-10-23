import {safeReturnPath} from '../routes';
const key='paisatrace-pending-shared-invitation';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const browserStore=()=>{try{return typeof window==='undefined'?undefined:window.localStorage;}catch{return undefined;}};
/** A short-lived, browser-local handoff allows an email verification tab to resume the invitation. */
export function rememberInvitation(path:string,store:Store|undefined=browserStore(),now=Date.now()){
 const safe=safeReturnPath(path);if(!store||!safe.startsWith('/shared/join#invite='))return;
 try{store.setItem(key,JSON.stringify({path:safe,expires:now+60*60*1000}));}catch{/* The original same-tab return still works when storage is unavailable. */}
}
export function pendingInvitation(store:Store|undefined=browserStore(),now=Date.now()):string|null{
 if(!store)return null;try{const value=JSON.parse(store.getItem(key)??'null');if(value&&typeof value.path==='string'&&value.expires>now&&safeReturnPath(value.path)===value.path&&value.path.startsWith('/shared/join#invite='))return value.path;store.removeItem(key);}catch{try{store.removeItem(key);}catch{}}return null;
}
export function clearInvitation(store:Store|undefined=browserStore()){try{store?.removeItem(key);}catch{}}
