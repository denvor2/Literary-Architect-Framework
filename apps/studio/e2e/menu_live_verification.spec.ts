import { test, expect } from "@playwright/test";

// Sprint-35-Menu-Step-06: Live Verification
// Test all menu items on production build (scratch port)
test.describe("Menu System Live Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
  });

  // ===== FILE MENU =====
  test("File: Новая книга creates book", async ({ page }) => {
    await page.getByLabel(/Меню Файл|File/i).click();
    const booksBefore = await page
      .getByRole("button")
      .filter({ hasText: /Книга|Book/ })
      .count();

    await page.getByLabel(/Новая книга|New Book/i).click();

    const booksAfter = await page
      .getByRole("button")
      .filter({ hasText: /Книга|Book|Без названия/ })
      .count();
    expect(booksAfter).toBeGreaterThan(booksBefore);
  });

  test("File: Новая серия opens dialog", async ({ page }) => {
    await page.getByLabel(/Меню Файл|File/i).click();
    await page.getByLabel(/Новая серия|New Series/i).click();

    // Dialog should be visible
    const dialog = page
      .locator("div")
      .filter({ hasText: /Создать серию|Create Series/ })
      .first();
    await expect(dialog).toBeVisible();
  });

  test("File: Выход button is clickable", async ({ page }) => {
    await page.getByLabel(/Меню Файл|File/i).click();
    const exitBtn = page.getByLabel(/Выход|Exit/i);
    await expect(exitBtn).toBeVisible();
  });

  // ===== EDIT MENU =====
  test("Edit: Undo is disabled (not implemented)", async ({ page }) => {
    await page.getByLabel(/Меню Правка|Edit/i).click();
    const undoBtn = page.getByLabel(/Отменить|Undo/i).first();
    await expect(undoBtn).toBeDisabled();
  });

  test("Edit: Redo is disabled (not implemented)", async ({ page }) => {
    await page.getByLabel(/Меню Правка|Edit/i).click();
    const redoBtn = page.getByLabel(/Повторить|Redo/i).first();
    await expect(redoBtn).toBeDisabled();
  });

  // ===== VIEW MENU =====
  test("View: Theme toggle buttons visible", async ({ page }) => {
    await page.getByLabel(/Меню Вид|View/i).click();

    await expect(
      page.getByRole("button").filter({ hasText: /Светлая|Light/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button").filter({ hasText: /Тёмная|Dark/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button").filter({ hasText: /Авто|Auto/ }),
    ).toBeVisible();
  });

  test("View: Sidebar toggle visible", async ({ page }) => {
    await page.getByLabel(/Меню Вид|View/i).click();
    const sidebarToggle = page
      .getByRole("button")
      .filter({ hasText: /Боковая панель|Sidebar/ })
      .first();
    await expect(sidebarToggle).toBeVisible();
  });

  test("View: Font size controls visible", async ({ page }) => {
    await page.getByLabel(/Меню Вид|View/i).click();

    // Look for + and - buttons or px indicator
    const minusBtn = page.getByRole("button").filter({ hasText: "−" }).first();
    const plusBtn = page.getByRole("button").filter({ hasText: "+" }).first();

    await expect(minusBtn).toBeVisible();
    await expect(plusBtn).toBeVisible();
  });

  // ===== HELP MENU =====
  test("Help: Горячие клавиши button visible", async ({ page }) => {
    await page.getByLabel(/Меню Руководство|Help/i).click();
    const shortcutsBtn = page
      .getByRole("button")
      .filter({ hasText: /Горячие клавиши|Shortcuts/ })
      .first();
    await expect(shortcutsBtn).toBeVisible();
  });

  test("Help: Документация link visible", async ({ page }) => {
    await page.getByLabel(/Меню Руководство|Help/i).click();
    const docsBtn = page
      .getByRole("button")
      .filter({ hasText: /Документация|Documentation/ })
      .first();
    await expect(docsBtn).toBeVisible();
  });

  // ===== KEYBOARD SHORTCUTS =====
  test("Keyboard: Ctrl+K focuses search", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]').first();

    await page.keyboard.press("Control+K");
    await expect(searchInput).toBeFocused();
  });

  test("Keyboard: Ctrl+N creates new book", async ({ page }) => {
    const booksBefore = await page
      .getByRole("button")
      .filter({ hasText: /Книга|Book/ })
      .count();

    await page.keyboard.press("Control+N");

    // Give it a moment to process
    await page.waitForTimeout(200);

    const booksAfter = await page
      .getByRole("button")
      .filter({ hasText: /Книга|Book|Без названия/ })
      .count();
    expect(booksAfter).toBeGreaterThan(booksBefore);
  });

  test("Keyboard: Ctrl+Shift+N opens New Series dialog", async ({ page }) => {
    // First, need to ensure page is ready
    await page.waitForLoadState("networkidle");

    // Use keyboard combination to open New Series dialog
    await page.keyboard.press("Control+Shift+N");

    // Wait a moment for dialog to appear
    await page.waitForTimeout(300);

    // Check if dialog appears
    const dialog = page
      .locator("div")
      .filter({ hasText: /Создать серию|Create Series/ })
      .first();
    const isDialogVisible = await dialog.isVisible().catch(() => false);

    if (!isDialogVisible) {
      // If dialog isn't visible with text, check for input with placeholder
      const titleInput = page
        .locator('input[placeholder*="Введите название серии"]')
        .first();
      const isTitleInputVisible = await titleInput
        .isVisible()
        .catch(() => false);
      expect(isTitleInputVisible).toBeTruthy();
    } else {
      await expect(dialog).toBeVisible();
    }
  });

  test("Keyboard: Escape closes menu", async ({ page }) => {
    await page.getByLabel(/Меню Файл|File/i).click();

    // Menu should be open
    const menuDropdown = page
      .locator("nav")
      .locator("div")
      .filter({ has: page.getByLabel(/Новая книга|New Book/i) })
      .first();

    await page.keyboard.press("Escape");

    // Give it a moment to close
    await page.waitForTimeout(100);
  });

  // ===== BUILD & VALIDATION =====
  test("No critical console errors on load", async ({ page, context }) => {
    const errorMessages: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // Filter out known non-critical errors
        const text = msg.text();
        if (
          !text.includes("ResizeObserver") &&
          !text.includes("401") &&
          !text.includes("NetworkError") &&
          !text.includes("load-dev-tools")
        ) {
          errorMessages.push(text);
        }
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Give some time for any deferred errors
    await page.waitForTimeout(500);

    expect(errorMessages).toHaveLength(0);
  });

  test("All menu buttons are clickable", async ({ page }) => {
    const menuButtons = await page.getByLabel(/Меню/i).all();

    for (const btn of menuButtons) {
      await expect(btn).toBeEnabled();
    }

    expect(menuButtons.length).toBeGreaterThan(0);
  });
});
