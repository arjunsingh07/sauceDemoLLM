const { test, expect } = require('@playwright/test');
test('sanity: login and product list', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.fill('#user-name','standard_user');
  await page.fill('#password','secret_sauce');
  await page.click('#login-button');
  await expect(page.locator('.title')).toHaveText('Products');
});
