import {parseRoute,routeTitle,migratedOrigin} from './src/routes';
import { defineConfig, loadEnv } from 'vite';
import {homeDescription,homepageHtml,landingHtml,landingMetadata,privateShellHtml,readHomeBody} from './scripts/seo-html.mjs';
import react from '@vitejs/plugin-react';
import blogPosts from './content/blog/posts.json';
import hosting from './vercel.json';
// Legacy workspace links retain their private/demo boundary, including query strings.
function reportsRedirect(req:{url?:string},res:{statusCode:number;setHeader:(name:string,value:string)=>void;end:()=>void}) {
 const url=new URL(req.url||'/', 'http://localhost');
 const match=url.pathname.match(/^\/(app|demo)\/(reports|accounts)\/?$/);
 if(!match)return false;
 res.statusCode=308;res.setHeader('Location',`/${match[1]}/${match[2]==='reports'?'overview':'money-log'}${url.search}`);res.setHeader('X-Robots-Tag','noindex, follow');res.end();return true;
}
const blogRoutes=['/blog',...blogPosts.map(post=>'/blog/'+post.slug)];
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const site = migratedOrigin(env.VITE_SITE_URL?.replace(/\/$/, '')||'');
  const publicReady = Boolean(site && env.VITE_OPERATOR_NAME && env.VITE_CONTACT_EMAIL && (env.VITE_PUBLIC_POLICY_REVIEWED ?? env.VITE_POLICY_REVIEWED) === 'true');
  return { server:{watch:{usePolling:true,interval:300}}, plugins: [react(), {name: 'public-metadata', enforce:'post', configurePreviewServer(server){server.middlewares.use((req,res,next)=>{if(reportsRedirect(req as unknown as {url?:string},res))return;const request=req as unknown as {url?:string};const [path,query]=String(request.url).split('?');const rewrite=hosting.rewrites.find(route=>route.source===path)||hosting.rewrites.find(route=>route.source.endsWith('/:id')&&path.startsWith(route.source.slice(0,-3))&&path.split('/').length===4);if(rewrite)request.url=rewrite.destination+(query?'?'+query:'');next();});}, configureServer(server){server.middlewares.use((req,res,next)=>{if(reportsRedirect(req as unknown as {url?:string},res))return;const request=req as unknown as {url?:string};const [path,query]=String(request.url).split('?');if(blogRoutes.includes(path.replace(/\/$/,''))){request.url=path.replace(/\/$/,'')+'/index.html'+(query?'?'+query:'');next();return;}if(['/guide','/about','/privacy','/terms'].includes(path.replace(/\/$/,'')))request.url=path.replace(/\/$/,'')+'.html'+(query?'?'+query:'');next();});}, transformIndexHtml: {order:'post',async handler(html,ctx) {
    const requestPath=(ctx.originalUrl||ctx.path).split('?')[0];
    const route=parseRoute(requestPath==='/'||requestPath==='/index.html'?'/':requestPath);
    if(['personal-finance','shared-expenses'].includes(route.area)){const workspace=route.area==='personal-finance'?'personal':'shared';html=landingHtml(html,await readHomeBody(workspace),workspace,site,publicReady);return {html,tags:metadata(true,workspace)};}
    if(route.area==='home'){html=homepageHtml(html,await readHomeBody());}
    else {html=privateShellHtml(html);html=html.replace(/<title>[^<]*<\/title>/,'<title>'+routeTitle(route)+'</title>');}
    return {html,tags: metadata(route.area==='home')};
  }}, generateBundle: {order:"post",async handler(_options,bundle){
    const entry=bundle['index.html'];if(!entry||entry.type!=='asset')return;
    for(const workspace of ['personal','shared']){const path=workspace==='personal'?'personal-finance':'shared-expenses';this.emitFile({type:'asset',fileName:path+'/index.html',source:landingHtml(String(entry.source),await readHomeBody(workspace),workspace,site,publicReady)});}
    const original=privateShellHtml(String(entry.source));
    const paths=['login','signup','forgot-password','auth/callback','products','shared/join',...['shared','shared-demo'].flatMap(area=>['dashboard','groups','friends','activity','settlements','reports','settings'].map(page=>area+'/'+page)),...['app','demo'].flatMap(area=>['overview','money-log','income','money-plan','categories','settings',...(area==='app'?['admin']:[])].map(page=>area+'/'+page))];
    for(const path of paths){const html=original.replace(/<title>[^<]*<\/title>/,'<title>'+routeTitle(parseRoute('/'+path))+'</title>').replace(/(<meta name="robots" content=")[^"]*/,'$1noindex, follow').replace(/(<link rel="canonical" href=")[^"]*/, '$1'+site+'/'+path).replace(/(<meta property="og:url" content=")[^"]*/, '$1'+site+'/'+path);this.emitFile({type:'asset',fileName:path+'/index.html',source:html});}
  }}}] };
  function metadata(home:boolean,workspace?:'personal'|'shared') {
    const description=workspace?landingMetadata[workspace].description:homeDescription;const title=workspace?landingMetadata[workspace].title:'PaisaTrace — Personal Finance & Shared Expenses';const path=workspace?landingMetadata[workspace].path:'/';
    const sharing = [
      {tag:'meta',attrs:{property:'og:site_name',content:'PaisaTrace'}},
      {tag:'meta',attrs:{property:'og:title',content:title}},
      {tag:'meta',attrs:{property:'og:description',content:description}},
      {tag:'meta',attrs:{property:'og:type',content:'website'}},
      {tag:'meta',attrs:{name:'twitter:card',content:'summary_large_image'}},
      {tag:'meta',attrs:{name:'twitter:title',content:title}},
      {tag:'meta',attrs:{name:'twitter:description',content:description}},
      ...(site ? [{tag:'meta',attrs:{property:'og:url',content:site+path}},{tag:'meta',attrs:{property:'og:image',content:site+'/social-card.png'}},{tag:'meta',attrs:{property:'og:image:alt',content:'PaisaTrace — Track spending. Plan your month.'}},{tag:'meta',attrs:{property:'og:image:width',content:'1200'}},{tag:'meta',attrs:{property:'og:image:height',content:'630'}},{tag:'meta',attrs:{name:'twitter:image',content:site+'/social-card.png'}},
      {tag:'script',attrs:{type:'application/ld+json'},children:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'PaisaTrace',alternateName:'Paisa Trace',url:site+'/',inLanguage:'en',description}).replace(/</g,'\\u003c')}] : [])
    ].map(tag=>({...tag,injectTo:'head' as const}));
    return [...sharing, ...(home?[{tag:'meta',attrs:{name:'google-site-verification',content:'8SimNb7oI6D1mlfI4svzAxFIQzMrrgFuaPt_sHxb4gU'},injectTo:'head' as const}]:[]), {tag: 'meta', attrs: {name: 'robots', content: publicReady && home ? 'index, follow' : 'noindex, follow'}, injectTo: 'head' as const}, ...(site ? [{tag: 'link', attrs: {rel: 'canonical', href:site+path}, injectTo: 'head' as const}] : [])];
  }
});
