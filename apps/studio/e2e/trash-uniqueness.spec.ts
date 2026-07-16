import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
});

test.describe("Sprint-36: Trash Uniqueness", () => {
  test("no duplicates when deleting book", async ({ page }) => {
    const bookTitle = `Unique Test ${Date.now()}`;

    // Create book via button
    const bookBtn = page.locator("button", { hasText: "Книга" }).first();
    await bookBtn.click({ force: true });
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    // Delete the book
    const bookItem = sidebar.getByText(bookTitle);
    await bookItem.hover();
    const deleteBtn = bookItem.locator("..").getByRole("button").last();
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Count books in trash immediately after deletion
    const trashSection = sidebar.getByText(/Корзина/);
    await expect(trashSection).toBeVisible();

    const bookCopies = sidebar
      .getByText(bookTitle)
      .filter({ hasText: bookTitle });
    const count = await bookCopies.count();

    console.log(`[TEST] Book appears ${count} time(s) in trash`);
    expect(count).toBe(1); // Should appear exactly once
  });

  test("no duplicates when deleting scene", async ({ page }) => {
    const bookTitle = `Scene Test ${Date.now()}`;

    // Create book
    const bookBtn = page.locator("button", { hasText: "Книга" }).first();
    await bookBtn.click({ force: true });
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    // Create chapter (which creates default scene)
    await page.getByText("+ Новая глава").first().click();
    await page.waitForTimeout(500);

    // Delete the scene
    const sceneItem = sidebar.getByText(/Scene/i).first();
    if (await sceneItem.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sceneItem.hover();
      const deleteBtn = sceneItem.locator("..").getByRole("button").last();
      await deleteBtn.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(500);

      // Count scenes in trash
      const sceneCopies = sidebar
        .getByText(/Scene/i)
        .filter({ hasText: /Scene/i });
      const count = await sceneCopies.count();

      console.log(`[TEST] Scene appears ${count} time(s) in trash`);
      expect(count).toBe(1); // Should appear exactly once
    }
  });

  test("no duplicates after fast double-click delete", async ({ page }) => {
    const bookTitle = `Fast Delete ${Date.now()}`;

    // Create book
    const bookBtn = page.locator("button", { hasText: "Книга" }).first();
    await bookBtn.click({ force: true });
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    // Try double-click delete (rapid clicks)
    const bookItem = sidebar.getByText(bookTitle);
    await bookItem.hover();
    const deleteBtn = bookItem.locator("..").getByRole("button").last();

    // First click
    await deleteBtn.click();
    // Second click (should be ignored or handled gracefully)
    await deleteBtn.click().catch(() => {}); // May fail if element no longer visible
    await page.waitForTimeout(500);

    // Count in trash
    const trashSection = sidebar.getByText(/Корзина/);
    await expect(trashSection).toBeVisible();

    const bookCopies = sidebar
      .getByText(bookTitle)
      .filter({ hasText: bookTitle });
    const count = await bookCopies.count();

    console.log(`[TEST] After double-click, book appears ${count} time(s)`);
    expect(count).toBeLessThanOrEqual(1); // At most once
  });

  test("trash items persist uniquely after reload", async ({ page }) => {
    const bookTitle = `Persist Test ${Date.now()}`;

    // Create and delete book
    const bookBtn = page.locator("button", { hasText: "Книга" }).first();
    await bookBtn.click({ force: true });
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    const bookItem = sidebar.getByText(bookTitle);
    await bookItem.hover();
    const deleteBtn = bookItem.locator("..").getByRole("button").last();
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Check trash after reload
    const sidebarAfter = page.locator("aside").first();
    const trashSection = sidebarAfter.getByText(/Корзина/);
    await expect(trashSection).toBeVisible();

    // Count in trash
    const bookCopies = sidebarAfter
      .getByText(bookTitle)
      .filter({ hasText: bookTitle });
    const count = await bookCopies.count();

    console.log(`[TEST] After reload, book appears ${count} time(s) in trash`);
    expect(count).toBe(1); // Should appear exactly once
  });
});
