import {observePublicSession,publicEntry} from './publicSession';
// Generated public documents use the same session observer as the React landing pages.
const stop=observePublicSession(signedIn=>{
 const entry=publicEntry(signedIn);
 document.querySelectorAll<HTMLAnchorElement>('a[data-public-account]').forEach(link=>{link.href=entry.href;link.textContent=entry.label;});
 document.querySelectorAll<HTMLAnchorElement>('a[data-public-signin]').forEach(link=>{link.hidden=signedIn;});
});
window.addEventListener('pagehide',event=>{if(!event.persisted)stop();});
