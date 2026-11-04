import {LayoutDashboard,ReceiptText,ArrowDownLeft,Target,Tags,Plus} from 'lucide-react';
import WorkspaceShell from './WorkspaceShell';
import {LoadingState,RetryState,WorkspacePanel} from './WorkspaceUI';
export const personalDestinations=[{id:'overview',label:'Overview',Icon:LayoutDashboard},{id:'entries',label:'Money Log',Icon:ReceiptText},{id:'income',label:'Income',Icon:ArrowDownLeft},{id:'money-plan',label:'Money Plan',mobileLabel:'Plan',Icon:Target}];
/** The authenticated frame remains usable before the private ledger is available. */
export default function PersonalWorkspaceState({active,demo,email,error,retry,navigate,hidden,togglePrivacy,signOut,signingOut=false}:{active:string;demo:boolean;email?:string;error?:string;retry:()=>void;navigate:(page:string)=>void;hidden:boolean;togglePrivacy:()=>void;signOut:()=>void|Promise<void>;signingOut?:boolean}){
 const title=personalDestinations.find(d=>d.id===active)?.label??(active==='categories'?'Categories':active==='settings'?'Settings':'Overview');
 return <WorkspaceShell product="personal" demo={demo} email={email} active={active} destinations={personalDestinations} navigate={navigate} title={title} tools={[{label:'Categories',Icon:Tags,active:active==='categories',open:()=>navigate('categories')}]} hidden={hidden} togglePrivacy={togglePrivacy} signOut={signOut} busy={signingOut} primary={<button className="button" disabled title="Recording is available after your ledger loads"><Plus size={18} aria-hidden="true"/>Record</button>}>
  <WorkspacePanel title={error?'Could not open your ledger':'Opening your ledger'}>{error?<RetryState message={error} retry={retry}/>:<LoadingState/>}</WorkspacePanel>
 </WorkspaceShell>;
}
