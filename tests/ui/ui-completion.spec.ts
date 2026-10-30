import {test,expect,type Page} from '@playwright/test';
const fixtureUser={id:'00000000-0000-4000-8000-000000009901',aud:'authenticated',role:'authenticated',email:'ui-fixture@example.com',created_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'email'},user_metadata:{}};
async function fixtureAccount(page:Page){
 // CI uses a deliberately fake project. Never inject fixtures into a real project.
 test.skip(process.env.PAISA_AUTH_FIXTURES!=='1','Requires the isolated CI authentication fixture');
 await page.addInitScript(({user})=>{localStorage.setItem('sb-fixtures-auth-token',JSON.stringify({access_token:'fixture-only-token',refresh_token:'fixture-only-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));},{user:fixtureUser});
 await page.route('**/auth/v1/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixtureUser)}));
}
test('repayment custom errors retain the amount and associate/focus the corrective field',async({page})=>{
 await page.goto('/shared-demo/dashboard');await page.getByRole('button',{name:'Record money received',exact:true}).first().click();const dialog=page.getByRole('dialog'),amount=dialog.getByLabel('Amount · PKR',{exact:true});
 await amount.fill('abc');await dialog.getByRole('button',{name:'Record repayment',exact:true}).click();await expect(amount).toBeFocused();await expect(amount).toHaveValue('abc');await expect(amount).toHaveAttribute('aria-invalid','true');await expect(amount).toHaveAccessibleDescription(/amount.*decimal/i);
 await amount.fill('999999999');await dialog.getByRole('button',{name:'Record repayment',exact:true}).click();await expect(amount).toHaveAccessibleDescription(/no larger than this outstanding balance/);await expect(dialog.getByRole('alert')).toHaveCount(1);
});
test('shared split validation marks shares and does not erase the draft',async({page})=>{
 await page.goto('/shared-demo/dashboard');await page.getByRole('button',{name:'Add expense',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('What was it for?').fill('Fictional lunch');await dialog.getByLabel('Amount · PKR',{exact:true}).fill('100');await dialog.getByLabel('Split method').selectOption('exact');
 const shares=dialog.locator('input[name=share]');for(const share of await shares.all())await share.fill('1');await dialog.getByRole('button',{name:'Save shared expense',exact:true}).click();await expect(shares.first()).toBeFocused();await expect(shares.first()).toHaveAttribute('aria-invalid','true');await expect(shares.first()).toHaveAccessibleDescription(/match|equal|total/i);await expect(dialog.getByLabel('What was it for?')).toHaveValue('Fictional lunch');
});
test('signed-in public visitors get workspace entry actions on React and generated pages',async({page})=>{
 await fixtureAccount(page);
 for(const [route,href] of [['/','/products'],['/personal-finance','/app/overview'],['/shared-expenses','/shared/dashboard']]){
  await page.goto(route);await expect(page.locator('.landing-actions a.button').first()).toHaveText('Open workspace');await expect(page.locator('.landing-actions a.button').first()).toHaveAttribute('href',href);
 }
 await page.goto('/guide');await expect(page.locator('.public-header a[data-public-account]').filter({visible:true}).first()).toHaveText('Open workspace');await expect(page.locator('.public-header a[data-public-signin]').filter({visible:true})).toHaveCount(0);
});
test('ledger failure retains the shell and retries without a page reload',async({page})=>{
 await fixtureAccount(page);let attempts=0;
 await page.route('**/rest/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const result=path.endsWith('/shared_preferences')?{personal_enabled:true,shared_enabled:true,last_product:'personal'}:false;
  if(path.endsWith('/initialize_ledger')){attempts++;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Fictional temporary ledger failure'})});return;}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 await page.goto('/app/overview');await expect(page.getByRole('heading',{name:'Could not open your ledger'})).toBeVisible();await expect(page.locator('.workspace-header h1')).toHaveText('Overview');await page.locator('.workspace-account-menu summary').click();await expect(page.locator('.workspace-account-menu').getByRole('button',{name:'Sign out',exact:true})).toBeVisible();await page.locator('.workspace-account-menu summary').press('Escape');
 const before=attempts;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect.poll(()=>attempts).toBeGreaterThan(before);await expect(page.getByRole('heading',{name:'Could not open your ledger'})).toBeVisible();
});
