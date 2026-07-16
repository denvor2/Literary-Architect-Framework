import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
});

test.describe("Sprint-35: UI Labels", () => {
  test("ideas section labeled as 'Идеи' not 'Заметки'", async ({ page }) => {
    const bookTitle = `Label Test ${Date.now()}`;

    // Create book
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();

    // Open Ideas section if collapsed
    const ideasHeader = sidebar.getByText(/^Идеи/);
    await ideasHeader.click();
    await page.waitForTimeout(300);

    // Check ideas section label
    const ideasLabel = sidebar.getByText(/^Идеи/);
    await expect(ideasLabel).toBeVisible();

    console.log("[TEST] ✓ Ideas section uses 'Идеи' label");

    // Verify 'Заметки' is NOT used
    const notesLabel = sidebar.getByText(/^Заметки/);
    const isVisible = await notesLabel
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    expect(isVisible).toBeFalsy();

    console.log("[TEST] ✓ 'Заметки' label not found");
    console.log("[TEST] ✅ PASS: Correct UI labels!");
  });

  test("create button shows '+ Добавить идею' not '+ Добавить заметку'", async ({
    page,
  }) => {
    const bookTitle = `Label Button Test ${Date.now()}`;

    // Create book
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();

    // Open Ideas section if collapsed
    const ideasHeader = sidebar.getByText(/^Идеи/);
    await ideasHeader.click();
    await page.waitForTimeout(300);

    // Find the "Добавить идею" button
    const createBtn = page
      .getByRole("button")
      .filter({ hasText: /Добавить идею/ });

    await expect(createBtn).toBeVisible({ timeout: 5000 });
    const btnText = await createBtn.textContent();
    expect(btnText).toContain("идею");
    expect(btnText).not.toContain("заметку");
    console.log("[TEST] ✓ Create button says '+ Добавить идею'");

    console.log("[TEST] ✅ PASS: Button label correct!");
  });

  test("all UI sections present in sidebar", async ({ page }) => {
    const bookTitle = `Sidebar Layout ${Date.now()}`;

    // Create book
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();

    // All section headers should be visible (they're buttons in the accordion)
    // even if content is collapsed
    const sections = {
      Главы: await sidebar
        .getByRole("button")
        .filter({ hasText: /^Главы/ })
        .isVisible({ timeout: 1000 })
        .catch(() => false),
      Персонажи: await sidebar
        .getByRole("button")
        .filter({ hasText: /^Персонажи/ })
        .isVisible({ timeout: 1000 })
        .catch(() => false),
      Идеи: await sidebar
        .getByRole("button")
        .filter({ hasText: /^Идеи/ })
        .isVisible({ timeout: 1000 })
        .catch(() => false),
      Корзина: await sidebar
        .getByRole("button")
        .filter({ hasText: /^Корзина/ })
        .isVisible({ timeout: 1000 })
        .catch(() => false),
    };

    Object.entries(sections).forEach(([name, visible]) => {
      if (visible) {
        console.log(`[TEST] ✓ Section present: ${name}`);
      } else {
        console.log(`[TEST] ⚠ Section not found: ${name}`);
      }
    });

    // Expect all main sections to be present
    expect(sections["Главы"]).toBeTruthy();
    expect(sections["Персонажи"]).toBeTruthy();
    expect(sections["Идеи"]).toBeTruthy();
    expect(sections["Корзина"]).toBeTruthy();

    console.log("[TEST] ✅ PASS: All UI sections present!");
  });
});
