import {go} from './helpers';
import {test,expect} from '@playwright/test';

test('both independent modules are discoverable from the common homepage and sign-in',async({page})=>{
 await page.goto('/#products');
 await expect(page.getByRole('heading',{name:'Your own money. Your shared costs.',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Try a demo',exact:true}).click();
 await page.getByRole('dialog',{name:'Choose a demo'}).getByRole('link',{name:/^Shared Expenses demo/}).click();
 await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Workspace switcher'}).filter({visible:true})).toContainText('Shared Expenses');
 await page.locator('.workspace-selector summary').filter({visible:true}).click();
 await page.getByRole('navigation',{name:'Workspace switcher'}).filter({visible:true}).getByRole('link',{name:'Personal Finance',exact:true}).click();
 await expect(page).toHaveURL(/\/demo\/overview$/);
 await go(page,'Money Log');
 const switcher=page.getByRole('navigation',{name:'Workspace switcher'}).filter({visible:true});
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
