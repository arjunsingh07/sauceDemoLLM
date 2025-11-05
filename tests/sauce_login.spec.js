import { test, expect } from '@playwright/test';

test('Sauce Demo cart functionality', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('#login-button');
  await expect(page).toHaveURL(/.*\/inventory\.html/);
  await expect(page.locator('.title')).toHaveText('Products');
  await page.click('text=Sauce Labs Backpack');
  await page.click('.btn_primary.btn_inventory');
  await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  await page.close();
});