import {useSyncExternalStore} from 'react';
export type DateFormat='friendly'|'day-first'|'iso';
type DisplayPreferences={dateFormat:DateFormat;hideOnOpen:boolean};
const defaults:DisplayPreferences={dateFormat:'friendly',hideOnOpen:false};
const key='paisatrace-display-v2';let cached:DisplayPreferences|undefined;
export function readDisplayPreferences():DisplayPreferences{
 if(cached)return cached;
 try{const raw=JSON.parse(localStorage.getItem(key)??'{}');cached={dateFormat:['friendly','day-first','iso'].includes(raw.dateFormat)?raw.dateFormat:'friendly',hideOnOpen:raw.hideOnOpen===true};}catch{cached={...defaults};}return cached!;
}
export function updateDisplayPreferences(value:DisplayPreferences){localStorage.setItem(key,JSON.stringify(value));cached=value;window.dispatchEvent(new Event('paisatrace-display'));}
export function useDisplayPreferences(){return useSyncExternalStore(listener=>{const changed=()=>{cached=undefined;listener();};window.addEventListener('paisatrace-display',changed);window.addEventListener('storage',changed);return()=>{window.removeEventListener('paisatrace-display',changed);window.removeEventListener('storage',changed);};},readDisplayPreferences,()=>defaults);}
