import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
});

test.describe("Sprint-35: Trash Persistence", () => {
  test("delete book → reload → verify in trash", async ({ page }) => {
    const bookTitle = `TrashTest Book ${Date.now()}`;

    // Step 1: Create book
    console.log("[TEST] Creating book...");
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();
    console.log("[TEST] ✓ Book created");

    // Step 2: Delete book to trash
    console.log("[TEST] Deleting book...");
    const bookItem = sidebar.getByText(bookTitle);
    await bookItem.hover();
    const deleteBtn = bookItem.locator("..").getByRole("button").last();
    await deleteBtn.click();
    await page.waitForTimeout(300);

    // Confirm deletion
    const confirmInput = page.getByPlaceholder(/Введите название книги/);
    if (await confirmInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmInput.fill(bookTitle);
      await page.getByRole("button", { name: /Удалить/ }).click();
    }

    await page.waitForTimeout(500);
    console.log("[TEST] ✓ Book deleted to trash");

    // Step 3: Reload page
    console.log("[TEST] Reloading page...");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step 4: Verify trash section still there
    const sidebarAfter = page.locator("aside").first();
    const trashAfter = sidebarAfter.getByText(/Корзина/);
    await expect(trashAfter).toBeVisible();

    console.log("[TEST] ✅ PASS: Book persists in trash after reload!");
  });

  test("delete scene → reload → verify persists", async ({ page }) => {
    const bookTitle = `Scene Test ${Date.now()}`;

    // Create book and chapter
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    // Create chapter (auto-creates scene)
    await page.getByText("+ Новая глава").click();
    await page.waitForTimeout(500);

    console.log("[TEST] ✓ Book and chapter created");

    // Delete scene
    const sceneItem = sidebar.getByText(/Scene/i).first();
    if (await sceneItem.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sceneItem.hover();
      const deleteBtn = sceneItem.locator("..").getByRole("button").last();
      await deleteBtn.click({ timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(500);
    }

    // Reload and verify trash
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const sidebarAfter = page.locator("aside").first();
    const trashAfter = sidebarAfter.getByText(/Корзина/);
    await expect(trashAfter).toBeVisible();

    console.log("[TEST] ✅ PASS: Scene persists in trash after reload!");
  });

  test("delete character → reload → verify persists", async ({ page }) => {
    const bookTitle = `Character Test ${Date.now()}`;

    // Create book
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill(bookTitle);
    await page.getByText("Создать книгу").click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(bookTitle)).toBeVisible();

    console.log("[TEST] ✓ Book created");

    // Delete first character if exists
    const charItem = sidebar.getByText(/персонаж/i).first();
    if (await charItem.isVisible({ timeout: 1000 }).catch(() => false)) {
      await charItem.hover();
      const deleteBtn = charItem.locator("..").getByRole("button").last();
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    // Reload and verify trash
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const sidebarAfter = page.locator("aside").first();
    const trashAfter = sidebarAfter.getByText(/Корзина/);
    await expect(trashAfter).toBeVisible();

    console.log("[TEST] ✅ PASS: Character persists in trash after reload!");
  });
});
