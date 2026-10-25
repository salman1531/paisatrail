import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './Home';
import {parseRoute} from './routes';
import {workspaceFromSearch,saveWorkspaceIntent,workspaceDestination} from './workspaceIntent';
import './styles.css';
import './design-system.css';
const intended=workspaceFromSearch(location.search);
if(intended&&['login','signup','forgot-password'].includes(parseRoute(location.pathname).area)){try{sessionStorage.setItem('paisatrace-return-route',workspaceDestination(intended));}catch{}saveWorkspaceIntent(intended);}
const root=ReactDOM.createRoot(document.getElementById('root')!);
// Keep the public landing page light. Hash-based legacy links and email callbacks
// still load the full application and its existing protected acceptance flow.
const publicRoute=parseRoute(location.pathname,location.hash);
if(['home','personal-finance','shared-expenses'].includes(publicRoute.area)&&(!location.hash||['#products','#shared-expenses','#demos','#how-it-works'].includes(location.hash))) {
  root.render(<React.StrictMode><Home workspace={publicRoute.area==='personal-finance'?'personal':publicRoute.area==='shared-expenses'?'shared':undefined}/></React.StrictMode>);
} else {
  import('./ProductRoot').then(({default:App})=>root.render(<React.StrictMode><App/></React.StrictMode>)).catch(()=>{
    root.render(<main className="loading" role="alert"><h1>Unable to open PaisaTrace</h1><p>Please reload the page to try again.</p><a href="/">Return home</a></main>);
  });
}

if(import.meta.env.DEV&&new URLSearchParams(location.search).get('a11y')==='1')void import('./a11y/dev-audit');
