import { expect, test } from '@playwright/test';
test('verified recovery opens password form, survives reload, and updates the same account', async ({page}) => {
  const user = {id:'00000000-0000-4000-8000-000000000099', aud:'authenticated', role:'authenticated', email:'recovery-fixture@example.com', created_at:'2026-01-01T00:00:00Z', app_metadata:{provider:'email'}, user_metadata:{}};
  let updated = false;
  await page.route('**/auth/v1/**', async route => {
    if (route.request().method() === 'PUT') {expect(route.request().postDataJSON()).toMatchObject({password:'fixture phrase only'}); updated = true;}
    await route.fulfill({status:200, contentType:'application/json', body:JSON.stringify(user)});
  });
  await page.route('**/rest/v1/**', route => route.fulfill({status:200, contentType:'application/json', body:'{}'}));
  const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const token = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id, exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})}.fixture-signature`;
  await page.goto(`/#access_token=${token}&refresh_token=fixture-refresh-only&expires_in=3600&token_type=bearer&type=recovery`);
  await expect(page.getByRole('heading',{name:'Confirm your account',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Set your password',exact:true})).toHaveCount(0);
  await page.getByLabel('Your email address',{exact:true}).fill(user.email);
  await page.getByRole('button',{name:'Continue to password recovery',exact:true}).click();
  await expect(page.getByRole('heading', {name:'Set your password',exact:true})).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', {name:'Set your password',exact:true})).toBeVisible();
  await page.getByLabel('Password',{exact:true}).fill('fixture phrase only'); await page.getByLabel('Confirm password').fill('fixture phrase only');
  await page.getByRole('button',{name:'Save password'}).click(); await expect(page.getByRole('heading',{name:'Set your password',exact:true})).toHaveCount(0); expect(updated).toBe(true);
  expect(await page.evaluate(()=>sessionStorage.getItem('paisatrail-password-recovery'))).toBeNull();
});
