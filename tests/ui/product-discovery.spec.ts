import {test,expect} from '@playwright/test';

test('both independent modules are discoverable from the common homepage and sign-in',async({page})=>{
 await page.goto('/#products');
 await expect(page.getByRole('heading',{name:'Your own money. Your shared costs.',exact:true})).toBeVisible();
 await page.getByRole('article').filter({has:page.getByRole('heading',{name:'Shared Expenses',exact:true})}).getByRole('link',{name:'Shared Expenses demo',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Product switcher'})).toContainText('Shared Expenses');
 await page.getByRole('navigation',{name:'Product switcher'}).getByRole('link',{name:'Switch product',exact:true}).click();
 await expect(page).toHaveURL(/\/demo\/overview$/);
 await page.getByRole('button',{name:'Money Log',exact:true}).click();
 const switcher=page.getByRole('navigation',{name:'Product switcher'});
 await expect(switcher).toContainText('Personal Finance');
 await expect(switcher.getByRole('link',{name:'Switch product',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await switcher.getByRole('link',{name:'Switch product',exact:true}).click();
 await expect(page).toHaveURL(/\/shared-demo\/dashboard$/);
 await page.goto('/login');
 await expect(page.getByRole('button',{name:'Personal Finance demo',exact:true})).toBeVisible();
 await expect(page.locator('.login-benefit').getByRole('link',{name:'Shared Expenses demo',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
