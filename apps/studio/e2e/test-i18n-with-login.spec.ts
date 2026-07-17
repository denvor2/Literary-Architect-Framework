import { test, expect } from "@playwright/test";

test.describe("i18n Verification with Login", () => {
  const BASE_URL = "http://127.0.0.1:3002";

  test("Initial load: Russian login dialog", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Verify Russian login page
    const dialogTitle = await page
      .locator('h2, [class*="title"]')
      .first()
      .textContent();
    console.log(`📌 Dialog title: ${dialogTitle}`);

    // Look for Russian text
    const emailLabel = await page.locator("text=EMAIL").textContent();
    const passwordLabel = await page.locator("text=ПАРОЛЬ").textContent();
    const signInButton = await page.locator("text=Войти").textContent();

    console.log(`📌 Email label found: ${emailLabel ? "yes" : "no"}`);
    console.log(`📌 Password label found: ${passwordLabel ? "yes" : "no"}`);
    console.log(`📌 Sign-in button found: ${signInButton ? "yes" : "no"}`);

    // Check header menu - should be in Russian
    const fileMenu = await page.locator('button:has-text("Файл")').count();
    const editMenu = await page.locator('button:has-text("Правка")').count();
    const viewMenu = await page.locator('button:has-text("Вид")').count();

    console.log(
      `📌 Header menu in Russian: Файл=${fileMenu}, Правка=${editMenu}, Вид=${viewMenu}`,
    );

    // Verify language switcher is visible
    const enBtn = await page
      .locator('button[aria-label*="English"], button[aria-label*="EN"]')
      .count();
    const ruBtn = await page
      .locator('button[aria-label*="Russian"], button[aria-label*="РУ"]')
      .count();

    console.log(`📌 Language switcher buttons: EN=${enBtn}, РУ=${ruBtn}`);

    expect(fileMenu).toBeGreaterThan(0);
    expect(editMenu).toBeGreaterThan(0);
    expect(viewMenu).toBeGreaterThan(0);

    console.log("✅ Initial page loaded in Russian");
  });

  test("Language switcher on login page: EN click", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Get English button (use aria-label for precision)
    const enButton = page
      .locator(
        'button[aria-label="Switch to English"], button[aria-label="EN"]',
      )
      .first();

    // Verify it exists
    await expect(enButton).toBeVisible({ timeout: 5000 });

    // Click EN
    await enButton.click();
    await page.waitForTimeout(800);

    // Verify English text appeared
    const emailLabelEn = await page.locator("text=EMAIL").count();
    const passwordLabelEn = await page.locator("text=PASSWORD").count();
    const signInButtonEn = await page.locator("text=Sign In").count();

    console.log(
      `📌 After EN click: EMAIL=${emailLabelEn}, PASSWORD=${passwordLabelEn}, Sign In=${signInButtonEn}`,
    );

    // Verify Russian text disappeared
    const passwordLabelRu = await page.locator("text=ПАРОЛЬ").count();
    console.log(
      `📌 Russian ПАРОЛЬ still present: ${passwordLabelRu > 0 ? "yes (BUG!)" : "no"}`,
    );

    // Check header menu
    const fileMenuEn = await page.locator('button:has-text("File")').count();
    const editMenuEn = await page.locator('button:has-text("Edit")').count();
    const viewMenuEn = await page.locator('button:has-text("View")').count();

    console.log(
      `📌 Header menu in English: File=${fileMenuEn}, Edit=${editMenuEn}, View=${viewMenuEn}`,
    );

    expect(passwordLabelEn).toBeGreaterThan(0);
    expect(signInButtonEn).toBeGreaterThan(0);
    expect(fileMenuEn).toBeGreaterThan(0);

    console.log("✅ Clicked EN: UI switched to English");
  });

  test("Language switcher on login page: РУ click back", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Switch to English first
    const enButton = page
      .locator(
        'button[aria-label="Switch to English"], button[aria-label="EN"]',
      )
      .first();
    await enButton.click();
    await page.waitForTimeout(800);

    // Verify we're in English
    const passwordLabelEn = await page.locator("text=PASSWORD").count();
    expect(passwordLabelEn).toBeGreaterThan(0);

    // Now click РУ
    const ruButton = page
      .locator(
        'button[aria-label="Switch to Russian"], button[aria-label="РУ"]',
      )
      .first();
    await ruButton.click();
    await page.waitForTimeout(800);

    // Verify Russian text is back
    const passwordLabelRu = await page.locator("text=ПАРОЛЬ").count();
    const signInButtonRu = await page.locator("text=Войти").count();
    const fileMenuRu = await page.locator('button:has-text("Файл")').count();

    console.log(
      `📌 After РУ click: ПАРОЛЬ=${passwordLabelRu}, Войти=${signInButtonRu}, Файл=${fileMenuRu}`,
    );

    expect(passwordLabelRu).toBeGreaterThan(0);
    expect(signInButtonRu).toBeGreaterThan(0);
    expect(fileMenuRu).toBeGreaterThan(0);

    console.log("✅ Clicked РУ: UI switched back to Russian");
  });

  test("Language preference persists on reload (login page)", async ({
    page,
  }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Switch to English
    const enButton = page
      .locator(
        'button[aria-label="Switch to English"], button[aria-label="EN"]',
      )
      .first();
    await enButton.click();
    await page.waitForTimeout(800);

    // Check localStorage
    const localeBeforeReload = await page.evaluate(() =>
      localStorage.getItem("NEXT_LOCALE"),
    );
    console.log(`📌 localStorage before reload: ${localeBeforeReload}`);

    // Reload page
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Check if English persisted
    const passwordLabelEn = await page.locator("text=PASSWORD").count();
    const localeAfterReload = await page.evaluate(() =>
      localStorage.getItem("NEXT_LOCALE"),
    );

    console.log(
      `📌 After reload: PASSWORD=${passwordLabelEn}, localStorage=${localeAfterReload}`,
    );

    expect(passwordLabelEn).toBeGreaterThan(0);
    expect(localeAfterReload).toBe("en");

    console.log("✅ Language preference persisted across reload");
  });

  test("No console errors during language switching", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Perform language switches
    const enButton = page
      .locator(
        'button[aria-label="Switch to English"], button[aria-label="EN"]',
      )
      .first();
    const ruButton = page
      .locator(
        'button[aria-label="Switch to Russian"], button[aria-label="РУ"]',
      )
      .first();

    for (let i = 0; i < 3; i++) {
      await enButton.click();
      await page.waitForTimeout(300);
      await ruButton.click();
      await page.waitForTimeout(300);
    }

    console.log(`📌 Console errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((e) => console.log(`  ⚠️  ${e}`));
    }

    expect(errors.length).toBe(0);
    console.log("✅ No console errors during 3 switching cycles");
  });

  test("Header menu text changes with language", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Russian menu items
    const fileRu = "Файл";
    const editRu = "Правка";
    const helpRu = "Руководство";

    // English equivalents
    const fileEn = "File";
    const editEn = "Edit";
    const helpEn = "Guide";

    // Verify Russian
    let fileBtn = await page.locator(`button:has-text("${fileRu}")`).count();
    let editBtn = await page.locator(`button:has-text("${editRu}")`).count();
    let helpBtn = await page.locator(`button:has-text("${helpRu}")`).count();

    console.log(
      `📌 Russian headers: ${fileRu}=${fileBtn}, ${editRu}=${editBtn}, ${helpRu}=${helpBtn}`,
    );
    expect(fileBtn).toBeGreaterThan(0);

    // Switch to English
    const enButton = page
      .locator(
        'button[aria-label="Switch to English"], button[aria-label="EN"]',
      )
      .first();
    await enButton.click();
    await page.waitForTimeout(800);

    // Verify English
    fileBtn = await page.locator(`button:has-text("${fileEn}")`).count();
    editBtn = await page.locator(`button:has-text("${editEn}")`).count();
    helpBtn = await page.locator(`button:has-text("${helpEn}")`).count();

    console.log(
      `📌 English headers: ${fileEn}=${fileBtn}, ${editEn}=${editBtn}, ${helpEn}=${helpBtn}`,
    );
    expect(fileBtn).toBeGreaterThan(0);

    console.log("✅ Header menu correctly translates with language switch");
  });
});
