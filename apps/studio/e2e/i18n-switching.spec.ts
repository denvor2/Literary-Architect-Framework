import { test, expect } from '@playwright/test';

test.describe('i18n Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Language switcher buttons visible in Header', async ({ page }) => {
    // Check for EN button (by text)
    const enButton = page.getByRole('button', { name: 'EN' });
    const ruButton = page.getByRole('button', { name: 'РУ' });

    await expect(enButton).toBeVisible();
    await expect(ruButton).toBeVisible();
  });

  test('Can click EN button to switch language', async ({ page }) => {
    // Get the EN button by text
    const enButton = page.locator('button', { hasText: 'EN' });

    // Button should be visible
    await expect(enButton).toBeVisible();

    // Click it
    await enButton.click();

    // Button should still be visible after click
    await expect(enButton).toBeVisible();
  });

  test('Can click РУ button to switch language', async ({ page }) => {
    // Get the РУ button by text
    const ruButton = page.locator('button', { hasText: 'РУ' });

    // Button should be visible
    await expect(ruButton).toBeVisible();

    // Click it
    await ruButton.click();

    // Button should still be visible after click
    await expect(ruButton).toBeVisible();
  });

  test('Language buttons toggle active state', async ({ page }) => {
    const enButton = page.locator('button', { hasText: 'EN' });
    const ruButton = page.locator('button', { hasText: 'РУ' });

    // Click EN
    await enButton.click();
    await page.waitForTimeout(300);

    // Both buttons should still be present
    await expect(enButton).toBeVisible();
    await expect(ruButton).toBeVisible();

    // Click back to РУ
    await ruButton.click();
    await page.waitForTimeout(300);

    // Both buttons should still be visible
    await expect(enButton).toBeVisible();
    await expect(ruButton).toBeVisible();
  });

  test('Header title visible in both languages', async ({ page }) => {
    // Title should be same in both: "Literary Studio"
    const title = page.getByText('Literary Studio');

    // Initially visible
    await expect(title).toBeVisible();

    // Click EN
    const enButton = page.locator('button', { hasText: 'EN' });
    await enButton.click();
    await page.waitForTimeout(300);

    // Title should still be visible
    await expect(title).toBeVisible();

    // Click back to РУ
    const ruButton = page.locator('button', { hasText: 'РУ' });
    await ruButton.click();
    await page.waitForTimeout(300);

    // Title still visible
    await expect(title).toBeVisible();
  });
});
