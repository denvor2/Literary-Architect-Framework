import { test, expect } from "@playwright/test";

test.describe("i18n Live Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3456/");
    await page.waitForLoadState("networkidle");
    // Wait for client-side i18n to load
    await page.waitForTimeout(1000);
  });

  test("1. JSON files parse correctly", async ({ page }) => {
    const files = await page.evaluate(async () => {
      try {
        const [ruCommon, enCommon, ruExport, enExport] = await Promise.all([
          fetch("/locales/ru/common.json").then((r) => r.json()),
          fetch("/locales/en/common.json").then((r) => r.json()),
          fetch("/locales/ru/export.json").then((r) => r.json()),
          fetch("/locales/en/export.json").then((r) => r.json()),
        ]);
        return {
          ruCommonKeys: Object.keys(ruCommon),
          enCommonKeys: Object.keys(enCommon),
          ruExportKeys: Object.keys(ruExport),
          enExportKeys: Object.keys(enExport),
          ruDialogsCount: Object.keys(ruCommon.dialogs || {}).length,
          enDialogsCount: Object.keys(enCommon.dialogs || {}).length,
        };
      } catch (e) {
        return { error: (e as Error).message };
      }
    });

    expect(files).not.toHaveProperty("error");
    expect(files.ruCommonKeys).toContain("dialogs");
    expect(files.enCommonKeys).toContain("dialogs");
    expect(files.ruExportKeys).toContain("title");
    expect(files.enExportKeys).toContain("title");
    expect(files.ruDialogsCount).toBeGreaterThan(5);
    expect(files.enDialogsCount).toBeGreaterThan(5);
    console.log("✅ All JSON files parse correctly");
  });

  test("2. Menu buttons show translated text (not keys)", async ({ page }) => {
    // Wait a bit for hydration
    await page.waitForTimeout(500);

    const menuButtons = await page.locator("nav button").all();
    expect(menuButtons.length).toBeGreaterThan(0);

    for (const btn of menuButtons) {
      const text = await btn.textContent();
      // Should be Russian: Файл, Правка, Вид, Руководство, О программе
      // NOT translation keys like "menu.file"
      expect(text).not.toContain("menu.");
      expect(text).not.toContain("menu_items.");
    }
    console.log("✅ Menu buttons show translated text");
  });

  test("3. Header search placeholder is translated", async ({ page }) => {
    const searchInput = page.locator('input[type="text"]').first();
    const placeholder = await searchInput.getAttribute("placeholder");

    // Should be Russian placeholder like "Поиск по книге..."
    // NOT translation key "header.search_placeholder"
    expect(placeholder).not.toBe("header.search_placeholder");
    expect(placeholder).toBeTruthy();
    expect(placeholder?.length).toBeGreaterThan(3);
    console.log(`✅ Search placeholder translated: "${placeholder}"`);
  });

  test("4. Sidebar labels show translations (not keys)", async ({ page }) => {
    // Look for sidebar section labels
    const sidebarText = await page.locator("aside").first().textContent();

    // Should NOT contain translation keys
    expect(sidebarText).not.toContain("sidebar.books");
    expect(sidebarText).not.toContain("sidebar.chapters");
    expect(sidebarText).not.toContain("buttons.");

    // Should contain Russian text like "Книги", "Главы"
    expect(sidebarText).toContain("Книги");

    console.log("✅ Sidebar labels are translated");
  });

  test("5. Language toggle button exists and is labeled", async ({ page }) => {
    const languageSwitcher = page.locator('[data-testid="language-switcher"]');
    expect(await languageSwitcher.isVisible()).toBe(true);

    // Check EN and RU buttons exist
    const enBtn = languageSwitcher.locator('button:has-text("EN")');
    const ruBtn = languageSwitcher.locator('button:has-text("РУ")');

    expect(await enBtn.isVisible()).toBe(true);
    expect(await ruBtn.isVisible()).toBe(true);
    console.log("✅ Language switcher present with EN/RU buttons");
  });

  test("6. Critical keys exist in dialogs", async ({ page }) => {
    const dialogKeys = await page.evaluate(async () => {
      const res = await fetch("/locales/ru/common.json");
      const data = await res.json();

      return {
        hasSaveError: !!data.dialogs?.save_error,
        hasCloseButton: !!data.dialogs?.close_button,
        hasBackButton: !!data.dialogs?.back_button,
        hasCancelButton: !!data.dialogs?.cancel_button,
        hasNewBook: !!data.dialogs?.new_book,
        hasBookSettings: !!data.dialogs?.book_settings,
        hasSeriesSettings: !!data.dialogs?.series_settings,
        saveErrorText: data.dialogs?.save_error,
      };
    });

    expect(dialogKeys.hasSaveError).toBe(true);
    expect(dialogKeys.hasCloseButton).toBe(true);
    expect(dialogKeys.hasBackButton).toBe(true);
    expect(dialogKeys.hasCancelButton).toBe(true);
    expect(dialogKeys.hasNewBook).toBe(true);
    expect(dialogKeys.hasBookSettings).toBe(true);
    expect(dialogKeys.hasSeriesSettings).toBe(true);
    expect(dialogKeys.saveErrorText).toBe("Ошибка при сохранении");

    console.log("✅ All critical dialog keys present");
  });

  test("7. Export keys present in both locales", async ({ page }) => {
    const exportKeys = await page.evaluate(async () => {
      const [ruRes, enRes] = await Promise.all([
        fetch("/locales/ru/export.json"),
        fetch("/locales/en/export.json"),
      ]);

      const ru = await ruRes.json();
      const en = await enRes.json();

      return {
        ruTitle: ru.title,
        enTitle: en.title,
        ruHasFormats: !!ru.format?.["markdown-zip"],
        enHasFormats: !!en.format?.["markdown-zip"],
      };
    });

    expect(exportKeys.ruTitle).toBeTruthy();
    expect(exportKeys.enTitle).toBeTruthy();
    expect(exportKeys.ruHasFormats).toBe(true);
    expect(exportKeys.enHasFormats).toBe(true);
    console.log(
      `✅ Export keys present: RU="${exportKeys.ruTitle}", EN="${exportKeys.enTitle}"`,
    );
  });

  test("8. EditorArea message is translated", async ({ page }) => {
    const mainContent = await page.locator("main").textContent();

    // Should show Russian message like "Создайте первую книгу, чтобы начать"
    // NOT the key "editor.create_book"
    expect(mainContent).not.toContain("editor.create_book");
    expect(mainContent).toContain("Создайте первую книгу");

    console.log("✅ EditorArea message is properly translated");
  });
});
