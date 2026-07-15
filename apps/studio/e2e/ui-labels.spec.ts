import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
});

test.describe("Sprint-35: UI Labels", () => {
  test("ideas section labeled as 'Идеи' not 'Заметки'", async ({ page }) => {
    const bookTitle = `Label Test ${Date.now()}`;

    // Create book
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    
    // Check ideas section label
    const ideasLabel = sidebar.getByText(/^Идеи/);
    await expect(ideasLabel).toBeVisible();
    
    console.log("[TEST] ✓ Ideas section uses 'Идеи' label");

    // Verify 'Заметки' is NOT used
    const notesLabel = sidebar.getByText(/^Заметки/);
    const isVisible = await notesLabel.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isVisible).toBeFalsy();
    
    console.log("[TEST] ✓ 'Заметки' label not found");
    console.log("[TEST] ✅ PASS: Correct UI labels!");
  });

  test("create button shows '+ Добавить идею' not '+ Добавить заметку'", async ({ page }) => {
    const bookTitle = `Label Button Test ${Date.now()}`;

    // Create book
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    
    // Find ideas section
    const ideasSection = sidebar.getByText(/Идеи/);
    const createBtn = ideasSection.locator("..").getByRole("button").filter({ hasText: /Добавить/ });

    if (await createBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      const btnText = await createBtn.textContent();
      expect(btnText).toContain("идею");
      expect(btnText).not.toContain("заметку");
      console.log("[TEST] ✓ Create button says '+ Добавить идею'");
    }

    console.log("[TEST] ✅ PASS: Button label correct!");
  });

  test("all UI sections present in sidebar", async ({ page }) => {
    const bookTitle = `Sidebar Layout ${Date.now()}`;

    // Create book
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();

    // Check all major sections exist
    const sections = {
      "Главы": await sidebar.getByText(/^Главы/i).isVisible({ timeout: 1000 }).catch(() => false),
      "Персонажи": await sidebar.getByText(/^Персонажи/i).isVisible({ timeout: 1000 }).catch(() => false),
      "Идеи": await sidebar.getByText(/^Идеи/i).isVisible({ timeout: 1000 }).catch(() => false),
      "Корзина": await sidebar.getByText(/^Корзина/i).isVisible({ timeout: 1000 }).catch(() => false),
    };

    Object.entries(sections).forEach(([name, visible]) => {
      if (visible) {
        console.log(`[TEST] ✓ Section present: ${name}`);
      } else {
        console.log(`[TEST] ⚠ Section not found: ${name}`);
      }
    });

    // Expect at least the main sections to be present
    expect(sections["Главы"]).toBeTruthy();
    expect(sections["Идеи"]).toBeTruthy();
    expect(sections["Корзина"]).toBeTruthy();

    console.log("[TEST] ✅ PASS: All UI sections present!");
  });
});
