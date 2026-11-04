import {useEffect,useState} from 'react';
import {workspaceAuthPath,workspaceDestination,type Workspace} from './workspaceIntent';
/** UI affordance only. Workspace routes still enforce authentication/authorization.
 * The SDK is loaded after hydration; no account state enters prerendered HTML. */
export function observePublicSession(update:(signedIn:boolean)=>void){
 let active=true,unsubscribe=()=>{};
 void import('./api').then(({supabase})=>{
  if(!active)return;
  if(!supabase){update(false);return;}
  let revision=0;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{revision++;if(active)update(Boolean(session));});
  unsubscribe=()=>subscription.unsubscribe();
  const initial=revision;
  void supabase.auth.getSession().then(({data,error})=>{if(active&&initial===revision)update(!error&&Boolean(data.session));}).catch(()=>{if(active&&initial===revision)update(false);});
 }).catch(()=>{if(active)update(false);});
 return()=>{active=false;unsubscribe();};
}
export function usePublicSession(){const [signedIn,setSignedIn]=useState(false);useEffect(()=>observePublicSession(setSignedIn),[]);return signedIn;}
export function publicEntry(signedIn:boolean,workspace?:Workspace,label='Create free account'){
 return signedIn?{href:workspace?workspaceDestination(workspace):'/products',label:'Open workspace'}:{href:workspace?workspaceAuthPath(workspace):'/signup',label};
}
