import { test, expect } from "@playwright/test";

test.describe("i18n Simple Verification", () => {
  const BASE_URL = "http://127.0.0.1:3002";

  test("Language switcher visible and clickable", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Close any modal that might be blocking
    const closeButtons = await page
      .locator(
        'button[aria-label*="Close"], button:has-text("✕"), [role="dialog"] button:first-of-type',
      )
      .count();
    if (closeButtons > 0) {
      await page
        .locator('button[aria-label*="Close"]')
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    // Look for language switcher in header
    const enButton = page.locator('button:has-text("EN")');
    const ruButton = page.locator('button:has-text("РУ")');

    await expect(enButton).toBeVisible({ timeout: 5000 });
    await expect(ruButton).toBeVisible({ timeout: 5000 });

    console.log("✅ Language switcher buttons EN and РУ are visible");
  });

  test("Click EN → UI changes to English", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Close modal if present
    await page
      .locator('button[aria-label*="Close"]')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);

    // Get initial state
    const russianFileButton = await page.locator("text=Файл").count();
    console.log(`Initial Russian "Файл" count: ${russianFileButton}`);

    // Click EN button
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(800);

    // Verify English text
    const englishFileButton = await page.locator("text=File").count();
    console.log(`After EN click "File" count: ${englishFileButton}`);

    expect(englishFileButton).toBeGreaterThan(0);
    console.log('✅ Clicked EN: "Файл" → "File"');
  });

  test("Click РУ → UI changes to Russian", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Close modal
    await page
      .locator('button[aria-label*="Close"]')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);

    // Switch to English first
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(800);

    // Now click РУ
    const ruButton = page.locator('button:has-text("РУ")');
    await ruButton.click();
    await page.waitForTimeout(800);

    // Verify Russian text is back
    const russianFileButton = await page.locator("text=Файл").count();
    console.log(`After РУ click "Файл" count: ${russianFileButton}`);

    expect(russianFileButton).toBeGreaterThan(0);
    console.log('✅ Clicked РУ: "File" → "Файл"');
  });

  test("Reload page → language persists", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Close modal
    await page
      .locator('button[aria-label*="Close"]')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);

    // Switch to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(800);

    // Check localStorage
    const locale1 = await page.evaluate(() =>
      localStorage.getItem("NEXT_LOCALE"),
    );
    console.log(`Before reload, localStorage NEXT_LOCALE: ${locale1}`);

    // Reload
    await page.reload({ waitUntil: "networkidle" });

    // Close modal again if needed
    await page
      .locator('button[aria-label*="Close"]')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);

    // Check language persisted
    const englishFileButton = await page.locator("text=File").count();
    const locale2 = await page.evaluate(() =>
      localStorage.getItem("NEXT_LOCALE"),
    );

    console.log(`After reload "File" count: ${englishFileButton}`);
    console.log(`After reload, localStorage NEXT_LOCALE: ${locale2}`);

    expect(englishFileButton).toBeGreaterThan(0);
    console.log("✅ Language persisted after reload");
  });

  test("No console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Close modal
    await page
      .locator('button[aria-label*="Close"]')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);

    // Perform language switches
    const enButton = page.locator('button:has-text("EN")');
    const ruButton = page.locator('button:has-text("РУ")');

    await enButton.click();
    await page.waitForTimeout(500);

    await ruButton.click();
    await page.waitForTimeout(500);

    console.log(`Console errors during test: ${errors.length}`);
    errors.forEach((e) => console.log(`  ⚠️  ${e}`));

    expect(errors.length).toBe(0);
    console.log("✅ No console errors during language switching");
  });
});
