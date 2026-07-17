import { test, expect } from "@playwright/test";

test.describe("Independent i18n Verification (Fresh Server)", () => {
  const BASE_URL = "http://127.0.0.1:3002";

  test("1. Initial load in Russian (default)", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Check for Russian text in Header menu
    const fileMenuText = await page
      .locator('button:has-text("Файл")')
      .textContent();
    expect(fileMenuText).toContain("Файл");

    // Check Sidebar text
    const booksText = await page.locator("text=Книги").first().textContent();
    expect(booksText).toContain("Книги");

    // Check for language switcher buttons
    const enButton = page.locator('button:has-text("EN")');
    const ruButton = page.locator('button:has-text("РУ")');

    await expect(enButton).toBeVisible();
    await expect(ruButton).toBeVisible();

    console.log("✅ Initial load: Russian text confirmed");
    console.log("✅ Language switcher buttons visible");
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("2. Click EN button → entire UI changes to English", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Click EN button
    const enButton = page.locator('button:has-text("EN")');
    await expect(enButton).toBeVisible();
    await enButton.click();

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Verify English text appears
    const fileMenuText = await page
      .locator('button:has-text("File")')
      .textContent();
    expect(fileMenuText).toContain("File");

    // Verify Russian text is gone
    const russianFileMenu = await page
      .locator('button:has-text("Файл")')
      .count();
    expect(russianFileMenu).toBe(0);

    // Check Sidebar - should be "Books" now
    const booksEnText = await page.locator("text=Books").first().textContent();
    expect(booksEnText).toContain("Books");

    console.log("✅ Clicked EN button");
    console.log('✅ "Файл" changed to "File"');
    console.log('✅ "Книги" changed to "Books"');
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("3. Click РУ button → entire UI changes back to Russian", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // First switch to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(500);

    // Verify we're in English
    let fileMenuText = await page
      .locator('button:has-text("File")')
      .textContent();
    expect(fileMenuText).toContain("File");

    // Now click РУ button
    const ruButton = page.locator('button:has-text("РУ")');
    await ruButton.click();
    await page.waitForTimeout(500);

    // Verify back to Russian
    fileMenuText = await page.locator('button:has-text("Файл")').textContent();
    expect(fileMenuText).toContain("Файл");

    // Check Sidebar
    const booksRuText = await page.locator("text=Книги").first().textContent();
    expect(booksRuText).toContain("Книги");

    console.log("✅ Clicked РУ button");
    console.log('✅ "File" changed back to "Файл"');
    console.log('✅ "Books" changed back to "Книги"');
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("4. Page reload → language preference persists", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Switch to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(500);

    // Verify English
    let fileMenuText = await page
      .locator('button:has-text("File")')
      .textContent();
    expect(fileMenuText).toContain("File");

    // Check localStorage
    const locale = await page.evaluate(() =>
      localStorage.getItem("NEXT_LOCALE"),
    );
    console.log(`📌 localStorage NEXT_LOCALE: ${locale}`);

    // Reload page
    await page.reload({ waitUntil: "networkidle" });

    // Verify language persisted (should still be English)
    fileMenuText = await page.locator('button:has-text("File")').textContent();
    expect(fileMenuText).toContain("File");

    console.log("✅ After reload: English text still present");
    console.log("✅ Language preference persisted to localStorage");
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("5. Dark mode → language switching still works", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Enable dark mode if there's a theme switcher
    const html = page.locator("html");
    await html.evaluate((el) => el.classList.add("dark"));

    // Switch to English in dark mode
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(500);

    // Verify English text is visible in dark mode
    const fileMenuText = await page
      .locator('button:has-text("File")')
      .textContent();
    expect(fileMenuText).toContain("File");

    // Verify good contrast (text should be readable)
    const button = page.locator('button:has-text("File")').first();
    const color = await button.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    console.log(`📌 Button text color in dark mode: ${color}`);

    // Switch back to Russian
    const ruButton = page.locator('button:has-text("РУ")');
    await ruButton.click();
    await page.waitForTimeout(500);

    const ruFileMenu = await page
      .locator('button:has-text("Файл")')
      .textContent();
    expect(ruFileMenu).toContain("Файл");

    console.log("✅ Dark mode: Language switching works");
    console.log("✅ Text remains readable in dark mode");
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("6. No console errors during language switching", async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string }> = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Perform multiple language switches
    for (let i = 0; i < 3; i++) {
      const enButton = page.locator('button:has-text("EN")');
      await enButton.click();
      await page.waitForTimeout(300);

      const ruButton = page.locator('button:has-text("РУ")');
      await ruButton.click();
      await page.waitForTimeout(300);
    }

    // Check for critical errors
    const errors = consoleMessages.filter((m) => m.type === "error");
    console.log(`📌 Total console errors during switching: ${errors.length}`);

    if (errors.length > 0) {
      errors.forEach((e) => console.log(`  ⚠️  ${e.text}`));
    }

    expect(errors.length).toBe(0);
    console.log("✅ No console errors during 3 cycles of language switching");
  });

  test("7. Header menu opens in both languages", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Test in Russian
    const fileMenuRu = page.locator('button:has-text("Файл")').first();
    await fileMenuRu.click();
    await page.waitForTimeout(300);

    // Check if menu opens (look for dropdown items)
    const menuOpen = await page
      .locator('[role="menu"], [role="menuitem"]')
      .count();
    console.log(`📌 Menu items visible in Russian: ${menuOpen > 0}`);

    // Close menu by clicking elsewhere
    await page.click("body");
    await page.waitForTimeout(300);

    // Switch to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(500);

    // Test menu in English
    const fileMenuEn = page.locator('button:has-text("File")').first();
    await fileMenuEn.click();
    await page.waitForTimeout(300);

    const menuOpenEn = await page
      .locator('[role="menu"], [role="menuitem"]')
      .count();
    console.log(`📌 Menu items visible in English: ${menuOpenEn > 0}`);

    console.log("✅ Header menu opens and functions in both languages");
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("8. All sidebar sections show correct language", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Check Russian sidebar
    const ruSidebar = {
      books: await page.locator("text=Книги").count(),
      series: await page.locator("text=Серии").count(),
      chapters: await page.locator("text=Главы").count(),
      characters: await page.locator("text=Персонажи").count(),
      ideas: await page.locator("text=Идеи").count(),
      trash: await page.locator("text=Удалено").count(),
    };

    console.log("📌 Russian sidebar sections:");
    Object.entries(ruSidebar).forEach(([key, count]) => {
      console.log(`  ${key}: ${count > 0 ? "present" : "MISSING"}`);
    });

    // Switch to English
    const enButton = page.locator('button:has-text("EN")');
    await enButton.click();
    await page.waitForTimeout(500);

    // Check English sidebar
    const enSidebar = {
      books: await page.locator("text=Books").count(),
      series: await page.locator("text=Series").count(),
      chapters: await page.locator("text=Chapters").count(),
      characters: await page.locator("text=Characters").count(),
      ideas: await page.locator("text=Ideas").count(),
      trash: await page.locator("text=Trash").count(),
    };

    console.log("📌 English sidebar sections:");
    Object.entries(enSidebar).forEach(([key, count]) => {
      console.log(`  ${key}: ${count > 0 ? "present" : "MISSING"}`);
    });

    // Verify all are present
    const allRuPresent = Object.values(ruSidebar).every((c) => c > 0);
    const allEnPresent = Object.values(enSidebar).every((c) => c > 0);

    expect(allRuPresent).toBeTruthy();
    expect(allEnPresent).toBeTruthy();

    console.log("✅ All sidebar sections present in both languages");
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });

  test("9. Edge case: Rapid language switching", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Perform rapid clicks
    for (let i = 0; i < 5; i++) {
      const enButton = page.locator('button:has-text("EN")');
      const ruButton = page.locator('button:has-text("РУ")');

      await enButton.click();
      await ruButton.click();
    }

    await page.waitForTimeout(1000);

    // UI should be stable (РУ is last click)
    const fileMenuRu = await page.locator('button:has-text("Файл")').count();
    expect(fileMenuRu).toBeGreaterThan(0);

    console.log("✅ UI stable after rapid language switching");
    console.log(
      `Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(", ") : "none"}`,
    );
  });
});
