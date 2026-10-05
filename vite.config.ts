import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const site = env.VITE_SITE_URL?.replace(/\/$/, '');
  const publicReady = Boolean(site && env.VITE_OPERATOR_NAME && env.VITE_CONTACT_EMAIL && (env.VITE_PUBLIC_POLICY_REVIEWED ?? env.VITE_POLICY_REVIEWED) === 'true');
  return { plugins: [react(), {name: 'public-metadata', transformIndexHtml() {
    const description='Track daily expenses, income, savings and investments with PaisaTrace. Set monthly budgets in PKR or other currencies and review your spending. Free for personal use.';
    const sharing = [
      {tag:'meta',attrs:{property:'og:site_name',content:'PaisaTrace'}},
      {tag:'meta',attrs:{property:'og:title',content:'PaisaTrace — Your money, a little clearer'}},
      {tag:'meta',attrs:{property:'og:description',content:description}},
      {tag:'meta',attrs:{property:'og:type',content:'website'}},
      {tag:'meta',attrs:{name:'twitter:card',content:'summary_large_image'}},
      {tag:'meta',attrs:{name:'twitter:title',content:'PaisaTrace — Expense Tracker & Monthly Budget'}},
      {tag:'meta',attrs:{name:'twitter:description',content:description}},
      ...(site ? [{tag:'meta',attrs:{property:'og:url',content:site+'/'}},{tag:'meta',attrs:{property:'og:image',content:site+'/social-card.png'}},{tag:'meta',attrs:{property:'og:image:alt',content:'PaisaTrace — Track spending. Plan your month.'}},{tag:'meta',attrs:{property:'og:image:width',content:'1200'}},{tag:'meta',attrs:{property:'og:image:height',content:'630'}},{tag:'meta',attrs:{name:'twitter:image',content:site+'/social-card.png'}},
      {tag:'script',attrs:{type:'application/ld+json'},children:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'PaisaTrace',alternateName:'Paisa Trace',url:site+'/',inLanguage:'en',description}).replace(/</g,'\\u003c')}] : [])
    ].map(tag=>({...tag,injectTo:'head' as const}));
    return [...sharing, {tag: 'meta', attrs: {name: 'robots', content: publicReady ? 'index, follow' : 'noindex, follow'}, injectTo: 'head'}, ...(site ? [{tag: 'link', attrs: {rel: 'canonical', href: site + '/'}, injectTo: 'head' as const}] : [])];
  }}] };
});
