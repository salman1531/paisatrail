import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './Home';
import {parseRoute} from './routes';
import './styles.css';
import './design-system.css';
const root=ReactDOM.createRoot(document.getElementById('root')!);
// Keep the public landing page light. Hash-based legacy links and email callbacks
// still load the full application and its existing protected acceptance flow.
if(parseRoute(location.pathname,location.hash).area==='home'&&!location.hash) {
  root.render(<React.StrictMode><Home/></React.StrictMode>);
} else {
  import('./App').then(({default:App})=>root.render(<React.StrictMode><App/></React.StrictMode>)).catch(()=>{
    root.render(<main className="loading" role="alert"><h1>Unable to open PaisaTrace</h1><p>Please reload the page to try again.</p><a href="/">Return home</a></main>);
  });
}

if(import.meta.env.DEV&&new URLSearchParams(location.search).get('a11y')==='1')void import('./a11y/dev-audit');
