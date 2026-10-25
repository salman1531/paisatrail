import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

// Only public content is rendered. Never import App, API, or account state here.
export async function prerenderHome(root, mode, workspace) {
  const server = await createServer({root, mode, configFile:false, plugins:[react()], optimizeDeps:{noDiscovery:true,include:[]}, cacheDir:'.generated/prerender-cache', server:{middlewareMode:true,hmr:false}, appType:'custom'});
  try {
    const {default:Home} = await server.ssrLoadModule('/src/Home.tsx');
    return renderToStaticMarkup(createElement(Home,{workspace}));
  } finally { await server.close(); }
}

export async function prerenderPublicNavigation(root,mode){
 const server=await createServer({root,mode,configFile:false,plugins:[react()],optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'.generated/prerender-cache',server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{const {default:Nav}=await server.ssrLoadModule('/src/PublicNav.tsx');return renderToStaticMarkup(createElement(Nav));}finally{await server.close();}
}
