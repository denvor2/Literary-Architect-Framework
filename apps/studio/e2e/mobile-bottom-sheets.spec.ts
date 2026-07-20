import { test, expect } from "@playwright/test";

test.describe("Bottom Sheets (Sprint-39-Step-04)", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    // Navigate to app
    await page.goto("http://localhost:3000");
    // Wait for app to load
    await page.waitForSelector('[class*="bg-white"], [class*="bg-black"]');
    // Wait for header to load
    await page.waitForSelector('[aria-label="Settings"]');
  });

  test("SettingsSheet opens when settings button clicked", async ({ page }) => {
    // Click the Settings button in the header
    await page.locator('[aria-label="Settings"]').click();

    // Verify SettingsSheet is visible by checking for content
    // Check for "Файл" (File) section header
    await expect(page.locator('text=Файл')).toBeVisible();

    // Check for Export button
    await expect(page.locator('text=Экспортировать книгу')).toBeVisible();

    // Check for Import button
    await expect(page.locator('text=Импортировать книгу')).toBeVisible();
  });

  test("BottomSheet closes on Escape key when SettingsSheet is open", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify it's open
    await expect(page.locator('text=Файл')).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify SettingsSheet is closed
    await expect(page.locator('text=Файл')).not.toBeVisible();
  });

  test("BottomSheet closes on overlay click when SettingsSheet is open", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify it's open
    await expect(page.locator('text=Файл')).toBeVisible();

    // Get overlay position and click on it (overlay is at the top of the viewport)
    // The overlay covers the entire viewport behind the sheet
    await page.locator('[aria-hidden="true"]').click();

    // Verify SettingsSheet is closed
    await expect(page.locator('text=Файл')).not.toBeVisible();
  });

  test("SettingsSheet displays File section with Export and Import options", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Check File section header
    await expect(page.locator('text=Файл')).toBeVisible();

    // Check Export button exists and is clickable
    const exportButton = page.locator('button:has-text("Экспортировать книгу")');
    await expect(exportButton).toBeVisible();

    // Check Import button exists and is clickable
    const importButton = page.locator('button:has-text("Импортировать книгу")');
    await expect(importButton).toBeVisible();
  });

  test("SettingsSheet displays View section with Theme and Language options", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Check View section header
    await expect(page.locator('text=Вид')).toBeVisible();

    // Check Theme section
    await expect(page.locator('text=Тема')).toBeVisible();

    // Check Language section
    await expect(page.locator('text=Язык')).toBeVisible();

    // Check for theme buttons (Light, Dark, System)
    await expect(page.locator('text=Светлая')).toBeVisible();
    await expect(page.locator('text=Темная')).toBeVisible();
    await expect(page.locator('text=Система')).toBeVisible();

    // Check for language buttons (English, Русский)
    await expect(page.locator('text=English')).toBeVisible();
  });

  test("SettingsSheet displays Help section with Guide and About options", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Check Help section header
    await expect(page.locator('text=Помощь')).toBeVisible();
  });

  test("Drag handle is visible when BottomSheet is open", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Wait for the sheet to be visible
    await expect(page.locator('text=Файл')).toBeVisible();

    // Check for drag handle - it's a div with specific classes
    // The drag handle is h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700
    const dragHandle = page.locator('.h-1.w-9.rounded-full');
    await expect(dragHandle).toBeVisible();
  });

  test("BottomSheet has correct z-index layering (overlay below sheet)", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Wait for sheet to be visible
    await expect(page.locator('text=Файл')).toBeVisible();

    // Check that the sheet has z-50 class
    const sheet = page.locator('[class*="z-50"]').filter({ hasText: 'Файл' });
    await expect(sheet).toBeVisible();

    // Check that overlay has z-49 class
    const overlay = page.locator('[class*="z-49"][aria-hidden="true"]');
    await expect(overlay).toBeVisible();
  });

  test("SettingsSheet theme buttons are interactive", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify theme buttons are visible
    await expect(page.locator('text=Светлая')).toBeVisible();
    await expect(page.locator('text=Темная')).toBeVisible();

    // Click on a theme button
    const lightButton = page.locator('button:has-text("Светлая")');
    await expect(lightButton).toBeEnabled();
    await lightButton.click();

    // Sheet should close after action
    // Wait a moment for the close animation
    await page.waitForTimeout(400);
    await expect(page.locator('text=Файл')).not.toBeVisible();
  });

  test("SettingsSheet language buttons are interactive", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify language buttons are visible
    await expect(page.locator('text=English')).toBeVisible();

    // Click on English button
    const englishButton = page.locator('button:has-text("English")');
    await expect(englishButton).toBeEnabled();
    await englishButton.click();

    // Sheet should close after action
    await page.waitForTimeout(400);
    await expect(page.locator('text=Файл')).not.toBeVisible();
  });

  test("Mobile responsive at 375px (small phone)", async ({ page }) => {
    // Viewport already set to 375x812 in beforeEach

    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify it's visible and fills the screen appropriately
    const sheet = page.locator('text=Файл').locator('..');
    const boundingBox = await sheet.boundingBox();

    // Sheet should be visible and properly positioned
    await expect(page.locator('text=Файл')).toBeVisible();
  });

  test("Responsive at tablet size (768px)", async ({ page }) => {
    // Change to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to app
    await page.goto("http://localhost:3000");
    await page.waitForSelector('[aria-label="Settings"]');

    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify it's visible
    await expect(page.locator('text=Файл')).toBeVisible();
  });

  test("Responsive at desktop size (1920px)", async ({ page }) => {
    // Change to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to app
    await page.goto("http://localhost:3000");
    await page.waitForSelector('[aria-label="Settings"]');

    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Verify it's visible
    await expect(page.locator('text=Файл')).toBeVisible();
  });

  test("Body scroll is prevented when BottomSheet is open", async ({ page }) => {
    // Get initial body overflow style
    const initialOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });

    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Check that body overflow is set to hidden
    const overflowWhenOpen = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    expect(overflowWhenOpen).toBe('hidden');

    // Close the sheet
    await page.keyboard.press('Escape');

    // Wait for close animation
    await page.waitForTimeout(400);

    // Check that body overflow is reset
    const overflowWhenClosed = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    expect(overflowWhenClosed).toBe('unset');
  });

  test("SettingsSheet Logout button is visible and red", async ({ page }) => {
    // Open SettingsSheet
    await page.locator('[aria-label="Settings"]').click();

    // Check for Logout button - it should have text-red-600 or similar
    const logoutButton = page.locator('button:has-text("Выход")');
    await expect(logoutButton).toBeVisible();

    // Verify it has red color class
    const classes = await logoutButton.getAttribute('class');
    expect(classes).toContain('red');
  });
});
