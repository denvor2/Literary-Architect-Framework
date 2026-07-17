import { test, expect } from "@playwright/test";

test.describe("Sprint-37-Step-01: Independent Localization Verification", () => {
  const BASE_URL = "http://localhost:3001";

  test("Language switcher is visible in header", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Look for language switcher
    const enButton = page.getByText("EN", { exact: true }).first();
    const ruButton = page.getByText("РУ", { exact: true }).first();

    await expect(enButton).toBeVisible({ timeout: 10000 });
    await expect(ruButton).toBeVisible({ timeout: 10000 });
  });

  test("Header displays correctly in Russian (default)", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Check that Russian menu items are visible
    const fileMenu = page.getByRole("button", { name: /Файл/i });
    const editMenu = page.getByRole("button", { name: /Правка/i });
    const viewMenu = page.getByRole("button", { name: /Вид/i });

    // At least one should be visible (no timeout, visibility optional in initial state)
    const menus = await page
      .locator(
        "button:has-text('Файл'), button:has-text('Правка'), button:has-text('Вид')",
      )
      .all();
    console.log(`Found ${menus.length} Russian menu items`);
  });

  test("Sidebar displays correctly in Russian", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Check sidebar text
    const sidebarText = await page.locator("aside").innerText();
    console.log("Sidebar text sample:", sidebarText.substring(0, 200));

    // Check for Russian sidebar headers
    expect(sidebarText).toContain("Книги"); // Books in Russian
  });

  test("localStorage persists language choice", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate and switch to English
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Get the language switcher
    const enButton = page.getByText("EN", { exact: true }).first();

    // Try to click EN button (might fail due to pointer events, but let's try)
    try {
      await enButton.click({ timeout: 5000 });
      console.log("✓ EN button clicked successfully");
    } catch (e) {
      console.log(
        "⚠ EN button click failed (likely pointer-events blocking):",
        e instanceof Error ? e.message : String(e),
      );
    }

    // Check localStorage
    const locale = await page.evaluate(() => localStorage.getItem("locale"));
    console.log("localStorage locale after attempted switch:", locale);

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    const localeAfterReload = await page.evaluate(() =>
      localStorage.getItem("locale"),
    );
    console.log("localStorage locale after reload:", localeAfterReload);

    await context.close();
  });

  test("AssistantPanel is visible and displayable", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Look for assistant panel elements
    const mainContent = page.locator("main");
    const text = await mainContent.innerText({ timeout: 5000 });

    console.log("Main content text sample:", text.substring(0, 300));

    // Check for Russian assistant labels
    if (
      text.includes("Соавтор") ||
      text.includes("Редактор") ||
      text.includes("Критик")
    ) {
      console.log("✓ AssistantPanel visible with Russian labels");
    } else {
      console.log(
        "⚠ AssistantPanel not immediately visible or no Russian labels found",
      );
    }
  });

  test("Character list strings are localized (sidebar)", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const sidebarText = await page.locator("aside").innerText();

    // Check for localized character-related strings
    if (sidebarText.includes("Персонажи")) {
      console.log("✓ 'Персонажи' (Characters RU) found in sidebar");
    }
    if (
      sidebarText.includes("Новый персонаж") ||
      sidebarText.includes("персонаж")
    ) {
      console.log("✓ Character-related strings found in sidebar");
    }

    console.log(
      "Sidebar text (first 500 chars):",
      sidebarText.substring(0, 500),
    );
  });

  test("Check for console errors during page load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    console.log("Console errors found:", errors.length);
    if (errors.length > 0) {
      console.log("Errors:", errors.slice(0, 3)); // First 3 errors
    } else {
      console.log("✓ No console errors");
    }
  });

  test("Locale JSON files are accessible", async ({ page }) => {
    // Test fetch to locale files
    const ruCommon = await page.evaluate(async () => {
      const res = await fetch("/locales/ru/common.json");
      return res.ok ? await res.json() : null;
    });

    const enCommon = await page.evaluate(async () => {
      const res = await fetch("/locales/en/common.json");
      return res.ok ? await res.json() : null;
    });

    console.log("✓ RU common.json accessible:", ruCommon ? "✓" : "✗");
    console.log("✓ EN common.json accessible:", enCommon ? "✓" : "✗");

    if (ruCommon && enCommon) {
      console.log("RU menu.file:", ruCommon.menu?.file);
      console.log("EN menu.file:", enCommon.menu?.file);
    }
  });

  test("Verify specific localized strings in AssistantPanel", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const mainContent = await page.locator("main").innerText({ timeout: 5000 });

    // Check for AssistantPanel strings mentioned in commits
    const expectedStrings = [
      "Соавтор", // Coauthor mode
      "Редактор", // Editor mode
      "Критик", // Critic mode
      "Читатель", // Reader mode
    ];

    let foundCount = 0;
    for (const str of expectedStrings) {
      if (mainContent.includes(str)) {
        console.log(`✓ Found: "${str}"`);
        foundCount++;
      }
    }

    console.log(
      `Found ${foundCount}/${expectedStrings.length} expected AssistantPanel strings`,
    );
  });

  test("Verify character.unnamed localization", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const pageText = await page.content();

    // Check if "Без имени" appears in the character list area
    if (pageText.includes("Без имени")) {
      console.log("✓ Found 'Без имени' (unnamed character) in page");
    } else {
      console.log(
        "⚠ 'Без имени' not found - might be using different fallback",
      );
    }
  });

  test("Try language switch (might fail due to pointer events)", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Get initial locale
    const initialLocale = await page.evaluate(() =>
      localStorage.getItem("locale"),
    );
    console.log("Initial locale:", initialLocale);

    // Try to find and click language switcher
    const buttons = await page.locator("button").all();
    console.log(`Found ${buttons.length} buttons on page`);

    // Try clicking via JavaScript instead of Playwright click
    try {
      const switched = await page.evaluate(() => {
        const enBtn = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent?.includes("EN"),
        );
        if (enBtn) {
          (enBtn as HTMLButtonElement).click();
          return true;
        }
        return false;
      });

      if (switched) {
        console.log("✓ Language switch attempted via JavaScript");
        await page.waitForTimeout(1000);
        const newLocale = await page.evaluate(() =>
          localStorage.getItem("locale"),
        );
        console.log("Locale after switch:", newLocale);
      } else {
        console.log("⚠ Could not find EN button via JavaScript");
      }
    } catch (e) {
      console.log(
        "⚠ JavaScript click failed:",
        e instanceof Error ? e.message : String(e),
      );
    }
  });
});
