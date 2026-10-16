import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {homeDescription} from './seo-html.mjs';
import {posts,blogPaths} from './blog.mjs';
import {resources} from './blog-resources.mjs';
const dir=resolve(process.argv[2]||'dist');
const read=path=>readFile(resolve(dir,path),'utf8');
const home=await read('index.html');
const canonical=home.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
assert(canonical?.startsWith('https://'),'A configured public origin is required for release checks');
const origin=new URL(canonical).origin;
assert.equal((home.match(/<h1\b/g)||[]).length,1);
assert(home.includes('Track expenses.<br/>Know what remains.'));
assert(home.includes(homeDescription));
assert(!home.includes('Loading PaisaTrace'));
assert(home.includes('8SimNb7oI6D1mlfI4svzAxFIQzMrrgFuaPt_sHxb4gU'),'Approved Search Console verification remains in initial HTML');
for(const path of ['/signup','/login','/demo/overview','/about','/guide','/privacy','/terms','/blog'])assert(home.includes(`href="${path}"`),`Initial HTML must link ${path}`);
const schemas=[...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
assert(schemas.some(s=>s['@type']==='WebSite'&&s.url===canonical));
const entryAsset=home.match(/<script[^>]*src="([^"]+)"/)?.[1];
assert(entryAsset,'Homepage entry asset is present');
const entry=await read(entryAsset.slice(1));
assert(!entry.includes('supabase.co'),'Homepage does not eagerly include the account backend');
assert(entry.includes('App-'),'Workspace is a separate dynamic entry');
for(const path of ['login','signup','forgot-password','auth/callback',...['app','demo'].flatMap(area=>['overview','money-log','income','money-plan','reports','categories','settings'].map(page=>area+'/'+page)),'app/admin']){
 const page=await read(path+'/index.html');
 assert(page.includes('noindex, follow'),path+' stays out of indexing');
 assert(!page.includes('home-hero'),path+' has no public homepage duplication');
 assert(page.includes(`href="${origin}/${path}"`),path+' canonical stays route-specific');
}
const sitemap=await read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(urls,['/','/about','/guide','/privacy','/terms',...blogPaths].map(p=>origin+p));
assert((await read('robots.txt')).includes(`Sitemap: ${origin}/sitemap.xml`));
for(const path of ['about','guide','privacy','terms']){
 const page=await read(path+'/index.html');assert(page.includes(`href="${origin}/${path}"`));assert.equal((page.match(/<h1\b/g)||[]).length,1);
}
assert((await read('about/index.html')).includes('<title>About PaisaTrace — Simple Personal Finance Tracking</title>'));
assert(!(await read('guide/index.html')).includes('status,.'));
assert((await stat(resolve(dir,'social-card.png'))).size>0);
const guide=await read('guide/index.html');
for(const post of posts){
 const html=await read('blog/'+post.slug+'/index.html');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert(html.includes('index, follow'));assert(!html.includes('AI-assisted'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema['@graph'][0].author.name,'PaisaTrace');assert.equal(schema['@graph'][0].author.url,origin+'/about#editorial');assert((await read('about/index.html')).includes('id="editorial"'));assert.equal(schema['@graph'][0].dateModified,post.modified);assert(html.includes(`datetime="${post.modified}"`));
 const visual=resources[post.slug];assert.equal(schema['@graph'][0].image,origin+'/blog-images/'+visual.image);assert(html.includes(`src="/blog-images/${visual.image}"`));const image=await readFile(resolve(dir,'blog-images/'+visual.image));assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),675);
 for(const link of html.matchAll(/href="#([^"]+)"/g))assert(html.includes(`id="${link[1]}"`));
 assert.equal(schema['@graph'][0].datePublished,post.published);assert.equal(schema['@graph'][0].headline,post.title);
 for(const match of html.matchAll(/href="(\/[^"?#]*)(#[^"]+)?"/g)){
  await stat(resolve(dir,match[1]==='/'?'index.html':match[1].slice(1)+(/\.[a-z]+$/.test(match[1])?'':'/index.html')));
  if(match[1]==='/guide'&&match[2])assert(guide.includes(`id="${match[2].slice(1)}"`),'Article guide anchor exists');
 }
 assert((await read('llms.txt')).includes(origin+'/blog/'+post.slug));
}
console.log(JSON.stringify({publicOrigin:origin,publicPages:urls.length,privateShells:19,initialHomeBytes:Buffer.byteLength(home),homepageJsBytes:Buffer.byteLength(entry),checks:'passed'}));
