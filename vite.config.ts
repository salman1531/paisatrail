import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const site = env.VITE_SITE_URL?.replace(/\/$/, '');
  const publicReady = Boolean(site && env.VITE_OPERATOR_NAME && env.VITE_CONTACT_EMAIL && (env.VITE_PUBLIC_POLICY_REVIEWED ?? env.VITE_POLICY_REVIEWED) === 'true');
  return { plugins: [react(), {name: 'public-metadata', transformIndexHtml() {
    return [{tag: 'meta', attrs: {name: 'robots', content: publicReady ? 'index, follow' : 'noindex, follow'}, injectTo: 'head'}, ...(site ? [{tag: 'link', attrs: {rel: 'canonical', href: site + '/'}, injectTo: 'head' as const}] : [])];
  }}] };
});
