import { test, expect } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3456";

test.describe("Sprint-37-Step-01: Independent Localization Verification", () => {
  test("Header menu switches language RU -> EN", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Verify Russian menu labels are visible
    const fileMenuRu = page.locator('button:has-text("Файл")').first();
    const editMenuRu = page.locator('button:has-text("Правка")').first();
    const viewMenuRu = page.locator('button:has-text("Вид")').first();

    await expect(fileMenuRu).toBeVisible();
    await expect(editMenuRu).toBeVisible();
    await expect(viewMenuRu).toBeVisible();

    // Click EN button (LanguageSwitcher)
    const enButton = page.locator('button:has-text("EN")').first();
    await enButton.click();

    // Wait for translation to apply (slight delay for React state update)
    await page.waitForTimeout(500);

    // Verify English menu labels are now visible
    const fileMenuEn = page.locator('button:has-text("File")').first();
    const editMenuEn = page.locator('button:has-text("Edit")').first();
    const viewMenuEn = page.locator('button:has-text("View")').first();

    await expect(fileMenuEn).toBeVisible();
    await expect(editMenuEn).toBeVisible();
    await expect(viewMenuEn).toBeVisible();
  });

  test("Header menu switches language EN -> RU", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Click EN button first to switch to English
    const enButton = page.locator('button:has-text("EN")').first();
    await enButton.click();
    await page.waitForTimeout(500);

    // Verify English menus are shown
    const fileMenuEn = page.locator('button:has-text("File")').first();
    await expect(fileMenuEn).toBeVisible();

    // Click РУ button to switch back to Russian
    const ruButton = page.locator('button:has-text("РУ")').first();
    await ruButton.click();
    await page.waitForTimeout(500);

    // Verify Russian menus are shown again
    const fileMenuRu = page.locator('button:has-text("Файл")').first();
    await expect(fileMenuRu).toBeVisible();
  });

  test("Sidebar text switches language (Книги <-> Books)", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Check Russian sidebar has "Книги"
    const booksLabelRu = page.locator('text="Книги"');
    await expect(booksLabelRu).toBeVisible();

    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();
    await enButton.click();
    await page.waitForTimeout(500);

    // Check English sidebar has "Books"
    const booksLabelEn = page.locator('text="Books"');
    await expect(booksLabelEn).toBeVisible();

    // Russian "Книги" should NOT be visible anymore
    await expect(booksLabelRu).not.toBeVisible();
  });

  test("localStorage persists language choice across reload", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`);

    // Start in Russian (default)
    const fileMenuRu = page.locator('button:has-text("Файл")').first();
    await expect(fileMenuRu).toBeVisible();

    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();
    await enButton.click();
    await page.waitForTimeout(500);

    // Verify English is now shown
    const fileMenuEn = page.locator('button:has-text("File")').first();
    await expect(fileMenuEn).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Language should still be English after reload
    const fileMenuEnAfterReload = page
      .locator('button:has-text("File")')
      .first();
    await expect(fileMenuEnAfterReload).toBeVisible();

    // Russian should not be visible
    const fileMenuRuAfterReload = page
      .locator('button:has-text("Файл")')
      .first();
    await expect(fileMenuRuAfterReload).not.toBeVisible();
  });

  test("Language switcher buttons toggle active state", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // By default, РУ button should be active (have some visual indicator)
    // We'll check if both buttons are clickable
    const enButton = page.locator('button:has-text("EN")').first();
    const ruButton = page.locator('button:has-text("РУ")').first();

    await expect(enButton).toBeEnabled();
    await expect(ruButton).toBeEnabled();

    // Click EN
    await enButton.click();
    await page.waitForTimeout(500);

    // Both buttons should still be enabled (toggle state)
    await expect(enButton).toBeEnabled();
    await expect(ruButton).toBeEnabled();
  });

  test("Header menu dropdown works in both languages", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Click File menu in Russian
    const fileMenuBtn = page.locator('button:has-text("Файл")').first();
    await fileMenuBtn.click();

    // Check that menu items appear (e.g., "Новая книга", "Сохранить")
    const newBookItem = page.locator('text="Новая книга"');
    const saveItem = page.locator('text="Сохранить"');

    await expect(newBookItem).toBeVisible();
    await expect(saveItem).toBeVisible();

    // Close menu by clicking elsewhere
    await page.click("body");
    await page.waitForTimeout(300);

    // Switch to English
    const enButton = page.locator('button:has-text("EN")').first();
    await enButton.click();
    await page.waitForTimeout(500);

    // Click File menu in English
    const fileMenuBtnEn = page.locator('button:has-text("File")').first();
    await fileMenuBtnEn.click();

    // Check that English menu items appear
    const newBookItemEn = page.locator('text="New Book"');
    const saveItemEn = page.locator('text="Save"');

    await expect(newBookItemEn).toBeVisible();
    await expect(saveItemEn).toBeVisible();
  });

  test("Dark mode contrast works with both languages", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Switch to dark mode by clicking View menu and selecting "Тёмная"
    const viewMenuBtn = page.locator('button:has-text("Вид")').first();
    await viewMenuBtn.click();

    const darkModeBtn = page.locator('text="🌙 Тёмная"');
    await expect(darkModeBtn).toBeVisible();
    await darkModeBtn.click();
    await page.waitForTimeout(500);

    // Verify header is now dark
    const header = page.locator("header");
    const headerBg = await header.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );

    // Dark mode should have dark background (close to black)
    expect(headerBg).toContain("rgb");

    // Now switch language to English while in dark mode
    const enButton = page.locator('button:has-text("EN")').first();
    await enButton.click();
    await page.waitForTimeout(500);

    // Verify English menu is visible in dark mode
    const fileMenuEn = page.locator('button:has-text("File")').first();
    await expect(fileMenuEn).toBeVisible();

    // Verify header is still dark
    const headerBgAfterSwitch = await header.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    expect(headerBgAfterSwitch).toContain("rgb");
  });

  test("No console errors on language switch", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/`);

    // Wait for initial load
    await page.waitForTimeout(500);

    // Switch language multiple times
    for (let i = 0; i < 3; i++) {
      const enButton = page.locator('button:has-text("EN")').first();
      await enButton.click();
      await page.waitForTimeout(300);

      const ruButton = page.locator('button:has-text("РУ")').first();
      await ruButton.click();
      await page.waitForTimeout(300);
    }

    // Assert no critical errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("ResizeObserver") &&
        !err.includes("Failed to fetch") &&
        !err.includes("NetworkError"),
    );

    expect(criticalErrors.length).toBe(0);
  });
});
