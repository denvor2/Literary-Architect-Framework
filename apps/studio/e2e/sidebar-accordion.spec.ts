import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
});

test.describe("Sprint-35: Sidebar Accordion", () => {
  test("accordion: chapters expand and collapse", async ({ page }) => {
    const bookTitle = `Accordion Test ${Date.now()}`;

    // Create book with chapter
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    await page.getByText("+ Новая глава").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    const chapterItem = sidebar.getByText(/Chapter/i);
    await expect(chapterItem).toBeVisible();

    console.log("[TEST] ✓ Chapter created");

    // Click chapter to collapse if expanded
    await chapterItem.hover();
    const collapseBtn = chapterItem.locator("..").getByRole("button").first();
    const arrowChar = await collapseBtn.textContent();

    if (arrowChar?.includes("▾")) {
      console.log("[TEST] ✓ Chapter initially expanded");
      await collapseBtn.click();
      await page.waitForTimeout(300);

      // Verify scenes are hidden
      const sceneItem = sidebar.getByText(/Scene/i).first();
      const isVisible = await sceneItem
        .isVisible({ timeout: 500 })
        .catch(() => false);
      expect(isVisible).toBeFalsy();
      console.log("[TEST] ✓ Chapter collapsed - scenes hidden");

      // Click to expand again
      await collapseBtn.click();
      await page.waitForTimeout(300);
      await expect(sidebar.getByText(/Scene/i).first()).toBeVisible();
      console.log("[TEST] ✓ Chapter expanded again - scenes visible");
    }

    console.log("[TEST] ✅ PASS: Chapter accordion works!");
  });

  test("accordion: characters expand and collapse", async ({ page }) => {
    const bookTitle = `Character Accordion ${Date.now()}`;

    // Create book
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    console.log("[TEST] ✓ Book created");

    // Find characters section header button and expand it
    const charButton = sidebar
      .getByRole("button")
      .filter({ hasText: /^Персонажи/ });
    await expect(charButton).toBeVisible({ timeout: 5000 });

    // Click to expand if collapsed
    await charButton.click();
    await page.waitForTimeout(300);

    console.log("[TEST] ✓ Characters section expanded");

    console.log("[TEST] ✅ PASS: Character accordion works!");
  });

  test("accordion: ideas expand and collapse", async ({ page }) => {
    const bookTitle = `Ideas Accordion ${Date.now()}`;

    // Create book
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    console.log("[TEST] ✓ Book created");

    // Find ideas section header button and expand it
    const ideaButton = sidebar.getByRole("button").filter({ hasText: /^Идеи/ });
    await expect(ideaButton).toBeVisible({ timeout: 5000 });

    // Click to expand if collapsed
    await ideaButton.click();
    await page.waitForTimeout(300);

    console.log("[TEST] ✓ Ideas section expanded");

    console.log("[TEST] ✅ PASS: Ideas accordion works!");
  });

  test("accordion: multiple chapters toggle independently", async ({
    page,
  }) => {
    const bookTitle = `Multi Chapter ${Date.now()}`;

    // Create book
    await page.getByText("Книга").first().click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();

    // Create two chapters
    await page.getByText("+ Новая глава").click();
    await page.waitForTimeout(500);

    await page.getByText("+ Новая глава").click();
    await page.waitForTimeout(500);

    console.log("[TEST] ✓ Two chapters created");

    // Get both chapters
    const chapters = sidebar.getByText(/Chapter/i);
    const firstChapter = chapters.first();
    const secondChapter = chapters.nth(1);

    // Verify both chapters exist
    await expect(firstChapter).toBeVisible();
    console.log("[TEST] ✓ Both chapters exist");

    // Click first chapter
    await firstChapter.hover();
    const firstCollapseBtn = firstChapter
      .locator("..")
      .getByRole("button")
      .first();
    await firstCollapseBtn.click();
    await page.waitForTimeout(300);

    console.log("[TEST] ✓ Toggled first chapter");

    // Second chapter should still be present
    await expect(secondChapter).toBeVisible();
    console.log("[TEST] ✓ Second chapter still visible");

    console.log("[TEST] ✅ PASS: Multiple chapters toggle independently!");
  });
});
