import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
it('sends an email link request without a password and restricts callback to the app origin', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fixture.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })); vi.stubGlobal('fetch', fetcher);
  const { supabase, configured } = await import('../src/api'); expect(configured).toBe(true);
  const result = await supabase!.auth.signInWithOtp({ email: 'person@example.com', options: { emailRedirectTo: 'https://ledger.example/', shouldCreateUser: true } });
  expect(result.error).toBeNull(); const [url, options] = fetcher.mock.calls[0]; expect(String(url)).toContain('/auth/v1/otp'); expect(String(url)).toContain('redirect_to=https%3A%2F%2Fledger.example%2F'); const body = JSON.parse(options.body); expect(body.email).toBe('person@example.com'); expect(body.create_user).toBe(true); expect(body).not.toHaveProperty('password'); expect(result.data.session).toBeNull();
  supabase!.auth.stopAutoRefresh();
});
it('does not initialize an authentication client without backend configuration', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', ''); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ''); const { supabase, configured, loadLedger } = await import('../src/api'); expect(configured).toBe(false); expect(supabase).toBeNull(); await expect(loadLedger('unverified-email')).rejects.toThrow('not connected');
});
