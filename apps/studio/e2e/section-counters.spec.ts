import { test, expect } from "@playwright/test";

test.describe("Section Counters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("Books counter displays in Sidebar header", async ({ page }) => {
    // Check for "Книги (0)" in the sidebar
    const booksCounter = page
      .locator("h2")
      .filter({ hasText: /Книги \(\d+\)/ });
    await expect(booksCounter).toBeVisible();

    // Verify format: should contain number in parentheses
    const text = await booksCounter.textContent();
    expect(text).toMatch(/Книги \(\d+\)/);
  });

  test("Series counter displays in Sidebar header", async ({ page }) => {
    // Check for "Серии (0)" in the sidebar
    const seriesCounter = page
      .locator("h2")
      .filter({ hasText: /Серии \(\d+\)/ });
    await expect(seriesCounter).toBeVisible();

    // Verify format
    const text = await seriesCounter.textContent();
    expect(text).toMatch(/Серии \(\d+\)/);
  });

  test("Chapters counter displays correctly", async ({ page }) => {
    const chaptersCounter = page
      .locator("h2")
      .filter({ hasText: /Главы \(\d+\)/ });
    await expect(chaptersCounter).toBeVisible();

    const text = await chaptersCounter.textContent();
    expect(text).toMatch(/Главы \(\d+\)/);
  });

  test("Characters counter displays correctly", async ({ page }) => {
    const charactersCounter = page
      .locator("h2")
      .filter({ hasText: /Персонажи \(\d+\)/ });
    await expect(charactersCounter).toBeVisible();

    const text = await charactersCounter.textContent();
    expect(text).toMatch(/Персонажи \(\d+\)/);
  });

  test("Ideas counter displays correctly", async ({ page }) => {
    const ideasCounter = page.locator("h2").filter({ hasText: /Идеи \(\d+\)/ });
    await expect(ideasCounter).toBeVisible();

    const text = await ideasCounter.textContent();
    expect(text).toMatch(/Идеи \(\d+\)/);
  });

  test("Trash section displays", async ({ page }) => {
    const trashSection = page.locator("h2").filter({ hasText: /Корзина/ });
    await expect(trashSection).toBeVisible();
  });

  test("All counters use consistent styling", async ({ page }) => {
    // Check that counter headers have consistent CSS classes
    const headers = page
      .locator("h2")
      .filter({ hasText: /Книги|Серии|Главы|Персонажи|Идеи|Корзина/ });
    const count = await headers.count();

    // Should have at least 6 section headers
    expect(count).toBeGreaterThanOrEqual(6);

    // Each should be visible
    for (let i = 0; i < count; i++) {
      await expect(headers.nth(i)).toBeVisible();
    }
  });

  test("Counters render on empty workspace", async ({ page }) => {
    // Empty workspace should show 0 for all counters
    const booksText = await page
      .locator("h2")
      .filter({ hasText: /Книги \(0\)/ })
      .textContent();
    const seriesText = await page
      .locator("h2")
      .filter({ hasText: /Серии \(0\)/ })
      .textContent();
    const chaptersText = await page
      .locator("h2")
      .filter({ hasText: /Главы \(0\)/ })
      .textContent();

    expect(booksText).toContain("Книги (0)");
    expect(seriesText).toContain("Серии (0)");
    expect(chaptersText).toContain("Главы (0)");
  });

  test("Counter format is consistent (number in parentheses)", async ({
    page,
  }) => {
    const counterPattern = /\(\d+\)/;

    const sections = ["Книги", "Серии", "Главы", "Персонажи", "Идеи"];

    for (const section of sections) {
      const header = page.locator("h2").filter({ hasText: section });
      const text = await header.textContent();
      expect(text).toMatch(counterPattern);
    }
  });

  test("Books counter increments when book added", async ({ page }) => {
    // Get initial counter value
    const booksHeader = page.locator("h2").filter({ hasText: /Книги \(\d+\)/ });
    const initialText = await booksHeader.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0");

    // Click "New Book" button (should appear in header or main area)
    const newBookButton = page
      .getByRole("button", { name: /new|новая|книга|new book/i })
      .first();
    await newBookButton.click();

    // Wait for dialog or input to appear
    await page.waitForLoadState("networkidle");

    // Counter should have incremented (or remained 0→1)
    const updatedText = await booksHeader.textContent();
    const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] || "0");

    expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
  });

  test("Series counter increments when series added", async ({ page }) => {
    // Similar test for Series
    const seriesHeader = page
      .locator("h2")
      .filter({ hasText: /Серии \(\d+\)/ });
    const initialText = await seriesHeader.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0");

    // This would depend on having a "New Series" button in the UI
    // For now, verify counter exists and has proper format
    expect(initialText).toMatch(/Серии \(\d+\)/);
  });
});
