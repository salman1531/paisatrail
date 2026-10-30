import {test,expect} from '@playwright/test';

test('both independent modules are discoverable from the common homepage and sign-in',async({page})=>{
 await page.goto('/#products');
 await expect(page.getByRole('heading',{name:'Your own money. Your shared costs.',exact:true})).toBeVisible();
 await page.locator('#demos').getByRole('link',{name:/^Shared Expenses demo/}).click();
 await expect(page.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Workspace switcher'})).toContainText('Shared Expenses');
 await page.locator('.workspace-selector summary').filter({visible:true}).click();
 await page.getByRole('navigation',{name:'Workspace switcher'}).getByRole('link',{name:'Personal Finance',exact:true}).click();
 await expect(page).toHaveURL(/\/demo\/overview$/);
 await page.getByRole('button',{name:'Money Log',exact:true}).click();
 const switcher=page.getByRole('navigation',{name:'Workspace switcher'});
 await expect(switcher).toContainText('Personal Finance');
 await expect(switcher.locator('summary')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await switcher.locator('summary').click(); await switcher.getByRole('link',{name:'Shared Expenses',exact:true}).click();
 await expect(page).toHaveURL(/\/shared-demo\/dashboard$/);
 await page.goto('/login');
 await expect(page.getByRole('button',{name:'Personal Finance',exact:true})).toBeVisible();
 await expect(page.locator('.auth-demo-options').getByRole('link',{name:'Shared Expenses',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
