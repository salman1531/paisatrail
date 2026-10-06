import { afterEach, expect, it, vi } from 'vitest';
import { authRedirectUrl } from '../src/authRedirect';
it('returns email links to the configured public site from local previews and old aliases', () => {
  for (const origin of ['http://127.0.0.1:5173', 'http://localhost:5173', 'https://paisatrail-eight.vercel.app', 'https://paisatrace.vercel.app']) {
    expect(authRedirectUrl('https://paisatrace.vercel.app', origin)).toBe('https://paisatrace.vercel.app/');
  }
  expect(authRedirectUrl(' https://paisatrace.vercel.app/ ', 'http://127.0.0.1:5173')).toBe('https://paisatrace.vercel.app/');
  expect(authRedirectUrl('', 'http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173/');
});
it('rejects invalid configured email destinations instead of falling back to a local preview', () => {
  for (const site of ['http://127.0.0.1:5173', 'https://ledger.example/path', 'https://ledger.example/?next=x', 'https://ledger.example/#token', 'https://user:password@ledger.example/', 'not a URL']) {
    expect(() => authRedirectUrl(site, 'http://127.0.0.1:5173')).toThrow();
  }
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
it('uses password signup and login, and a separate non-enumerating recovery request', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fixture.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture'); vi.stubEnv('VITE_SITE_URL', 'https://ledger.example');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })); vi.stubGlobal('fetch', fetcher);
  const { supabase } = await import('../src/api');
  await supabase!.auth.signUp({ email: 'person@example.com', password: 'fixture phrase only', options: { emailRedirectTo: authRedirectUrl(undefined, 'http://127.0.0.1:5173') } });
  const [signupUrl, signupOptions] = fetcher.mock.calls[0]; expect(String(signupUrl)).toContain('/signup?redirect_to=https%3A%2F%2Fledger.example%2F'); expect(JSON.parse(signupOptions.body)).toMatchObject({email: 'person@example.com', password: 'fixture phrase only'});
  await supabase!.auth.signInWithPassword({email: 'person@example.com', password: 'fixture phrase only'});
  expect(String(fetcher.mock.calls[1][0])).toContain('/token?grant_type=password');
  await supabase!.auth.resetPasswordForEmail('person@example.com', { redirectTo: authRedirectUrl(undefined, 'http://127.0.0.1:5173') });
  expect(String(fetcher.mock.calls[2][0])).toContain('/recover?redirect_to=https%3A%2F%2Fledger.example%2F'); expect(JSON.parse(fetcher.mock.calls[2][1].body)).not.toHaveProperty('password');
  expect(fetcher.mock.calls.some(([url]) => String(url).includes('/otp'))).toBe(false); supabase!.auth.stopAutoRefresh();
});
it('does not initialize an authentication client without backend configuration', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', ''); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ''); const { supabase, configured, loadLedger } = await import('../src/api'); expect(configured).toBe(false); expect(supabase).toBeNull(); await expect(loadLedger('unverified-email')).rejects.toThrow('not connected');
});
