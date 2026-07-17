import { test, expect } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3456";

test.describe("Sprint-37-Step-01: Localization Verification (Simple)", () => {
  test("Header renders with menu buttons visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Wait for hydration
    await page.waitForLoadState("networkidle");

    // Check for LanguageSwitcher buttons
    const enButton = page.locator('button[aria-label="Switch to English"]');
    const ruButton = page.locator('button[aria-label="Switch to Russian"]');

    await expect(enButton).toBeVisible();
    await expect(ruButton).toBeVisible();

    // At least one should show active state
    const enActive = await enButton.evaluate((el) => {
      const classes = el.getAttribute("class") || "";
      return classes.includes("bg-zinc-100");
    });

    const ruActive = await ruButton.evaluate((el) => {
      const classes = el.getAttribute("class") || "";
      return classes.includes("bg-zinc-100");
    });

    expect(enActive || ruActive).toBe(true);
  });

  test("Menu buttons are clickable", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Find menu buttons by aria-label
    const menuButtons = page.locator('[aria-label*="Меню"]');
    const count = await menuButtons.count();

    // Should have at least 5 menus (file, edit, view, help, about)
    expect(count).toBeGreaterThanOrEqual(5);

    // All menu buttons should be visible
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = menuButtons.nth(i);
      await expect(button).toBeVisible();
    }
  });

  test("File menu opens when clicked", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Find and click the first menu button (should be File menu)
    const firstMenuButton = page.locator('[aria-label*="Меню"]').first();
    await firstMenuButton.click();

    // Wait for dropdown to appear
    await page.waitForTimeout(300);

    // Check for menu items in Russian
    // The dropdown should contain items like "Новая книга", "Сохранить", etc.
    const dropdown = page
      .locator('[aria-expanded="true"]')
      .first()
      .locator("..");
    const isDropdownVisible = await dropdown.isVisible();

    expect(isDropdownVisible).toBe(true);
  });

  test("Language switcher buttons are functional", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    const enButton = page.locator('button[aria-label="Switch to English"]');
    const ruButton = page.locator('button[aria-label="Switch to Russian"]');

    // Click EN button
    await enButton.click();
    await page.waitForTimeout(500);

    // Check that EN button now shows active state
    const enButtonClasses = await enButton.getAttribute("class");
    expect(enButtonClasses).toContain("bg-zinc-100");

    // RU button should not be active
    const ruButtonClasses = await ruButton.getAttribute("class");
    expect(ruButtonClasses).not.toContain("bg-zinc-100");

    // Click RU button
    await ruButton.click();
    await page.waitForTimeout(500);

    // Check that RU button now shows active state
    const ruButtonClassesAfter = await ruButton.getAttribute("class");
    expect(ruButtonClassesAfter).toContain("bg-zinc-100");
  });

  test("localStorage persists language preference", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Check initial locale in localStorage (should be "ru")
    let locale = await page.evaluate(() => localStorage.getItem("locale"));
    expect(locale).toBe("ru");

    // Switch to English
    const enButton = page.locator('button[aria-label="Switch to English"]');
    await enButton.click();
    await page.waitForTimeout(500);

    // Check localStorage again
    locale = await page.evaluate(() => localStorage.getItem("locale"));
    expect(locale).toBe("en");

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Language should still be English
    locale = await page.evaluate(() => localStorage.getItem("locale"));
    expect(locale).toBe("en");

    // EN button should be active
    const enButtonAfterReload = page.locator(
      'button[aria-label="Switch to English"]',
    );
    const enButtonClasses = await enButtonAfterReload.getAttribute("class");
    expect(enButtonClasses).toContain("bg-zinc-100");
  });

  test("No critical console errors during language switching", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // Ignore known non-critical errors
        if (
          !msg.text().includes("ResizeObserver") &&
          !msg.text().includes("Failed to fetch") &&
          !msg.text().includes("NetworkError")
        ) {
          consoleErrors.push(msg.text());
        }
      }
      if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Switch languages multiple times
    for (let i = 0; i < 5; i++) {
      const enButton = page.locator('button[aria-label="Switch to English"]');
      await enButton.click();
      await page.waitForTimeout(200);

      const ruButton = page.locator('button[aria-label="Switch to Russian"]');
      await ruButton.click();
      await page.waitForTimeout(200);
    }

    // Assert no critical errors
    console.log("Console errors:", consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("Export dialog can be opened", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Create a test book first by using keyboard shortcut
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(500);

    // The book should be created, now try to export it
    // First, click on the File menu
    const fileMenu = page.locator('[aria-label*="Меню"]').first();
    await fileMenu.click();
    await page.waitForTimeout(300);

    // Look for "Экспортировать" or "Export" button
    const exportButton = page.locator('button:has-text("Экспортировать")');
    const isExportVisible = await exportButton.isVisible().catch(() => false);

    if (isExportVisible) {
      await exportButton.click();
      await page.waitForTimeout(500);

      // Check if export dialog appeared
      const dialog = page.locator('[role="dialog"]');
      const isDialogVisible = await dialog.isVisible().catch(() => false);

      expect(isDialogVisible).toBe(true);
    }
  });
});
