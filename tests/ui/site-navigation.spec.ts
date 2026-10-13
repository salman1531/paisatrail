import {test,expect} from '@playwright/test';

test('phone account actions remain reachable on every demo page and exiting preserves records',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const path of ['overview','money-log','income','money-plan','reports','categories','settings']){
  await page.goto('/demo/'+path);
  const menu=page.locator('.mobile-account-menu');
  await menu.locator('summary').press('Enter');
  const box=await menu.locator('div').boundingBox();
  expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);
  await expect(menu.getByRole('button',{name:'Exit demo',exact:true})).toBeVisible();
  await expect(menu.getByRole('button',{name:'Settings',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 }
 const saved=await page.evaluate(()=>localStorage.getItem('pocket-ledger-demo-v1'));
 await page.locator('.mobile-account-menu').getByRole('button',{name:'Exit demo',exact:true}).click();
 await expect(page).toHaveURL(/\/login$/);await expect(page.getByLabel('Email address')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('pocket-ledger-demo-v1'))).toBe(saved);
});

test('public footer has current routes and credit on the home, guide and policies',async({page})=>{
 for(const path of ['/','/about','/guide','/privacy','/terms']){
  await page.goto(path);const footer=page.locator('footer.site-footer');
  await expect(footer.getByRole('link',{name:'Rubix Labs',exact:true})).toHaveAttribute('href','https://www.hirubix.com/');
  await expect(footer.getByRole('link',{name:'User guide',exact:true})).toHaveAttribute('href','/guide');
  await expect(footer.getByRole('link',{name:'Privacy policy',exact:true})).toHaveAttribute('href','/privacy');
  await expect(footer.getByRole('link',{name:'Account sign-in',exact:true})).toHaveAttribute('href','/login');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
 }
});
