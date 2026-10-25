import {saveWorkspaceIntent} from './workspaceIntent';
import {useEffect,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import App from './App';
import {rememberInvitation} from './shared/invitationContext';
import {configured,supabase} from './api';
import {moveTo,safeReturnPath,useRoute} from './routes';
import BrandIdentity from './BrandIdentity';
import SiteFooter from './SiteFooter';
import SharedWorkspace from './shared/SharedWorkspace';
import JoinShared from './shared/JoinShared';
import {preferences} from './shared/service';
import type {ProductPreferences} from './shared/model';
import './shared/shared.css';
export function ProductChoice({user,pref,done,requested}:{user:User;pref:ProductPreferences|null;requested?:'personal'|'shared';done:()=>void}){
 const [name,setName]=useState(pref?.display_name==='Member'?'':pref?.display_name??''),[selected,setSelected]=useState<'personal'|'shared'>(requested??pref?.last_product??'shared'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <main className="product-choice"><a href="/"><BrandIdentity/></a><section className="panel"><p className="eyebrow">ONE ACCOUNT. YOUR CHOICE.</p><h1>What would you like to manage?</h1><p>Use either product on its own. You can switch or enable the other later.</p><form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{await preferences({personal:selected==='personal',shared:selected==='shared',last:selected,name:name.trim()||undefined});done();if(selected==='shared'&&location.pathname==='/shared/join')return;moveTo(selected==='shared'?'/shared/dashboard':'/app/overview');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><fieldset><legend>Choose a product</legend>{(['personal','shared'] as const).map(product=><label className={'product-option '+(selected===product?'selected':'')} key={product}><input type="radio" name="product" checked={selected===product} onChange={()=>setSelected(product)}/><span><strong>{product==='personal'?'Personal Finance':'Shared Expenses'}</strong><span>{product==='personal'?'Your income, spending, budgets and savings.':'Split costs with friends and groups. See who owes whom.'}</span></span></label>)}</fieldset>{selected==='shared'&&<><label>Your display name<input value={name} required maxLength={60} autoComplete="nickname" onChange={e=>setName(e.target.value)}/></label><p className="small muted">Members of spaces you join can see your name, shared expenses, splits and repayments. Your personal records stay private. <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a></p></>}{error&&<p role="alert" className="form-error">{error}</p>}<button className="button" disabled={busy}>{busy?'Saving…':'Continue'}</button></form><button className="text-button" disabled={busy} onClick={()=>void supabase?.auth.signOut()}>Sign out {user.email}</button></section><SiteFooter workspace/></main>;
}
export default function ProductRoot(){
 const route=useRoute(),[user,setUser]=useState<User|null>(null),[ready,setReady]=useState(!configured),[pref,setPref]=useState<ProductPreferences|null>(null),[prefReady,setPrefReady]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const shared=['shared','join','products'].includes(route.area),needsPref=shared||route.area==='app';
 useEffect(()=>{if(!supabase)return;let alive=true;const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(alive){setUser(session?.user??null);setReady(true);}});supabase.auth.getSession().then(r=>{if(alive){setUser(r.data.session?.user??null);setReady(true);}}).catch(()=>{if(alive)setReady(true);});return()=>{alive=false;subscription.unsubscribe();};},[]);
 useEffect(()=>{setPref(null);setPrefReady(false);setError('');if(!user||!needsPref)return;let alive=true;preferences().then(p=>{if(alive)setPref(p);}).catch(e=>{if(alive)setError((e as Error).message);}).finally(()=>{if(alive)setPrefReady(true);});return()=>{alive=false;};},[user?.id,needsPref,revision]);
 useEffect(()=>{if(!ready||!shared||user)return;if(route.area==='join')rememberInvitation(location.pathname+location.hash);sessionStorage.setItem('paisatrace-return-route',safeReturnPath(location.pathname+location.hash));if(route.area!=='join')saveWorkspaceIntent('shared');moveTo('/login',true);},[ready,shared,user?.id]);
 useEffect(()=>{const product=route.area==='app'?'personal':route.area==='shared'?'shared':null;let alive=true;if(user&&pref&&product&&pref[product==='shared'?'shared_enabled':'personal_enabled']&&pref.last_product!==product)void preferences({last:product}).then(value=>{if(alive)setPref(value);}).catch(()=>{});return()=>{alive=false;};},[route.area,user?.id,pref]);
 if(route.area==='shared-demo')return <SharedWorkspace demo/>;
 // Keep the existing explicit email identity acceptance and recovery flow intact.
 if(sessionStorage.getItem('paisatrail-password-recovery')==='true'||!needsPref)return <App/>;
 if(!ready||user&&!prefReady)return <main className="loading" role="status"><BrandIdentity/><span className="loading-spinner"/><h1>Opening your workspace…</h1></main>;
 if(!user)return shared?<main className="loading"><h1>Sign in to continue</h1><a href="/login">Sign in</a></main>:<App/>;
 if(error)return <main className="product-choice"><BrandIdentity/><h1>Unable to open your workspace</h1><p role="alert">{error}</p><button className="button" onClick={()=>setRevision(v=>v+1)}>Try again</button><a href="/app/overview">Personal Finance</a><a href="/shared-demo/dashboard">Explore the shared demo</a></main>;
 if(route.area==='products'||!pref?.personal_enabled&&route.area==='app'||!pref?.shared_enabled&&shared)return <ProductChoice user={user} pref={pref} requested={route.area==='app'?'personal':route.area==='shared'||route.area==='join'?'shared':undefined} done={()=>setRevision(v=>v+1)}/>;
 if(route.area==='join')return <JoinShared user={user} token={route.inviteToken}/>;
 if(route.area==='shared')return <SharedWorkspace user={user} pref={pref!}/>;
 return <App/>;
}
