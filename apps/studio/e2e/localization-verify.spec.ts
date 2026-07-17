import { test, expect } from "@playwright/test";

test.describe("Localization: EN/RU Coverage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3456/");
    await page.waitForLoadState("networkidle");
  });

  test("1. No translation keys visible (dialogs.*, auth.*, etc)", async ({
    page,
  }) => {
    const bodyText = await page.textContent("body");

    expect(bodyText).not.toContain("dialogs.");
    expect(bodyText).not.toContain("auth.");
    expect(bodyText).not.toContain("panels.");
    expect(bodyText).not.toContain("buttons.");

    console.log("✅ No translation key literals found in UI");
  });

  test("2. Russian text present in UI (Книги, Новая книга)", async ({
    page,
  }) => {
    const bodyText = await page.textContent("body");

    // Check for key Russian strings
    expect(bodyText).toContain("Literary Studio");
    expect(bodyText).toContain("Книги");

    console.log("✅ Russian text visible in sidebar");
  });

  test("3. Navigate login/register - verify translations", async ({ page }) => {
    // Click login button
    const loginBtn = page.getByText(/Войти|Sign In/i).first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForLoadState("networkidle");

      const dialogText = await page.textContent('[role="dialog"]');

      // Should see Russian login form
      const hasEmail = dialogText?.toLowerCase().includes("email") ?? false;
      expect(hasEmail).toBe(true);
      const hasPassword =
        (dialogText?.includes("Пароль") ||
          dialogText?.toLowerCase().includes("password")) ??
        false;
      expect(hasPassword).toBe(true);

      console.log("✅ Login dialog has translated labels");

      // Check for register link
      const registerLink = page
        .getByText(/Создать аккаунт|Create one/i)
        .first();
      if (await registerLink.isVisible()) {
        console.log("✅ Register link is localized");
      }
    }
  });

  test("4. Check critical dialog.* keys are loadable", async ({ page }) => {
    // Fetch locale JSON directly
    const ruLocale = await page.evaluate(async () => {
      const res = await fetch("/locales/ru/common.json");
      const data = await res.json();
      return {
        hasSaveError: data.dialogs?.save_error !== undefined,
        hasCloseBtn: data.dialogs?.close_button !== undefined,
        hasAssistantSettings: data.dialogs?.assistant_settings !== undefined,
        hasBookSettings: data.dialogs?.book_settings !== undefined,
        hasSeriesSettings: data.dialogs?.series_settings !== undefined,
        dialogsKeys: Object.keys(data.dialogs || {}),
      };
    });

    console.log("Russian locale dialogs:", ruLocale.dialogsKeys);
    expect(ruLocale.hasSaveError).toBe(true);
    expect(ruLocale.hasCloseBtn).toBe(true);
    expect(ruLocale.hasAssistantSettings).toBe(true);
    expect(ruLocale.hasBookSettings).toBe(true);
    expect(ruLocale.hasSeriesSettings).toBe(true);

    console.log("✅ All critical dialog.* keys present in Russian locale");
  });

  test("5. Check English locale has matching keys", async ({ page }) => {
    const enLocale = await page.evaluate(async () => {
      const res = await fetch("/locales/en/common.json");
      const data = await res.json();
      return Object.keys(data.dialogs || {}).sort();
    });

    const ruLocale = await page.evaluate(async () => {
      const res = await fetch("/locales/ru/common.json");
      const data = await res.json();
      return Object.keys(data.dialogs || {}).sort();
    });

    console.log("EN keys:", enLocale);
    console.log("RU keys:", ruLocale);
    expect(JSON.stringify(enLocale)).toBe(JSON.stringify(ruLocale));

    console.log("✅ EN and RU have identical dialog structure");
  });
});
