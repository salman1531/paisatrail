import {it,expect,vi,afterEach} from 'vitest';
import {renderToStaticMarkup as render} from 'react-dom/server';
import PublicNav from '../src/PublicNav';
import PersonalWorkspaceState from '../src/PersonalWorkspaceState';
import {publicEntry,observePublicSession} from '../src/publicSession';
import {expenseProblem,repaymentProblem} from '../src/shared/formValidation';
const auth=vi.hoisted(()=>({getSession:vi.fn(),onAuthStateChange:vi.fn()}));
vi.mock('../src/api',()=>({supabase:{auth}}));
afterEach(()=>vi.resetAllMocks());
const noop=()=>{};
it('retains common navigation/account access for ledger opening and retryable failure without fake financial totals',()=>{
 for(const error of [undefined,'Connection interrupted']){
  const html=render(<PersonalWorkspaceState active="entries" demo={false} email="fiction@example.com" error={error} retry={noop} navigate={noop} hidden={false} togglePrivacy={noop} signOut={noop}/>);
  expect(html).toContain('workspace-sidebar');expect(html).toContain('workspace-account-menu');expect(html).toContain('Money Log');expect(html).toContain('Help &amp; about');expect(html).toContain('Sign out');expect(html).not.toContain('0.00');
  expect(html).toContain(error?'Connection interrupted':'Loading records');expect(html.includes('>Retry<')).toBe(Boolean(error));
 }
});
it('keeps public entry destinations allow-listed and changes only signed-in UI affordances',()=>{
 expect(publicEntry(false,'shared')).toEqual({href:'/signup?next=%2Fshared%2Fdashboard',label:'Create free account'});
 expect(publicEntry(true,'shared')).toEqual({href:'/shared/dashboard',label:'Open workspace'});
 expect(publicEntry(true,'personal')).toEqual({href:'/app/overview',label:'Open workspace'});
 expect(publicEntry(true)).toEqual({href:'/products',label:'Open workspace'});
 const normal=render(<PublicNav/>),signedIn=render(<PublicNav signedIn/>);
 expect(normal).toContain('href="/signup"');expect(signedIn).toContain('href="/products"');expect(signedIn).toContain('Open workspace');const links=[...signedIn.matchAll(/<a\b[^>]*href="\/login"[^>]*>/g)];expect(links).toHaveLength(2);for(const link of links)expect(link[0]).toContain('hidden=""');
});
it('does not restore an older signed-in hint after a sign-out event races session loading',async()=>{
 let callback:((event:string,session:unknown)=>void)|undefined,resolve:((value:unknown)=>void)|undefined;
 const unsubscribe=vi.fn(),values:boolean[]=[];
 auth.onAuthStateChange.mockImplementation(fn=>{callback=fn;return {data:{subscription:{unsubscribe}}};});
 auth.getSession.mockReturnValue(new Promise(r=>{resolve=r;}));
 const stop=observePublicSession(value=>values.push(value));
 await vi.waitFor(()=>expect(auth.getSession).toHaveBeenCalledOnce());
 callback!('SIGNED_OUT',null);resolve!({data:{session:{user:{id:'fiction'}}},error:null});
 await Promise.resolve();expect(values).toEqual([false]);stop();expect(unsubscribe).toHaveBeenCalledOnce();
});
it('does not subscribe or update a public page that unmounts before its lazy client loads',async()=>{
 const update=vi.fn(),stop=observePublicSession(update);stop();await new Promise(r=>setTimeout(r,0));expect(auth.onAuthStateChange).not.toHaveBeenCalled();expect(update).not.toHaveBeenCalled();
});
it('identifies invalid amounts independently of the split method and directs reconciliation errors to the shares',()=>{
 const base={title:'Fictional lunch',amount:'100',space:true,participants:2,allocationError:'',method:'exact'};
 expect(expenseProblem(base)).toBeNull();expect(expenseProblem({...base,amount:'abc'})).toMatchObject({field:'amount'});
 expect(expenseProblem({...base,participants:0})).toMatchObject({field:'participant'});
 expect(expenseProblem({...base,allocationError:'Exact shares must match the total.'})).toMatchObject({field:'share'});
});
it('preserves exact repayment limits and points corrections to the affected control',()=>{
 expect(repaymentProblem({space:true,balance:10000,amount:'100'})).toBeNull();
 expect(repaymentProblem({space:true,balance:10000,amount:'100.01'})).toMatchObject({field:'amount'});
 expect(repaymentProblem({space:true,balance:10000,amount:'0'})).toMatchObject({field:'amount'});
 expect(repaymentProblem({space:true,amount:'50'})).toMatchObject({field:'balance'});
 expect(repaymentProblem({space:false,amount:'50'})).toMatchObject({field:'space'});
});
