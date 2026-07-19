import { test, expect } from "@playwright/test";

test.describe("Custom Experts", () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to app
    await page.goto("http://localhost:3001");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if logged in, if not skip
    const loginButton = await page.getByRole("button", { name: /log in/i }).first();
    if (loginButton) {
      test.skip();
    }
  });

  test("should open custom experts dialog", async ({ page }) => {
    // Look for button to open experts dialog (should be in AssistantPanel)
    const expertButton = await page.locator("button").filter({ hasText: /эксперт/i }).first();

    if (!expertButton) {
      test.skip();
    }

    // Click to open dialog
    await expertButton.click();

    // Wait for dialog to appear
    await page.waitForSelector('h2:has-text("Мои эксперты")', { timeout: 5000 });

    const dialog = page.locator('[role="heading"]:has-text("Мои эксперты")').first();
    await expect(dialog).toBeVisible();
  });

  test("should create new expert with typical requests", async ({ page }) => {
    // Open dialog
    const expertButton = await page.locator("button").filter({ hasText: /эксперт/i }).first();

    if (!expertButton) {
      test.skip();
    }

    await expertButton.click();
    await page.waitForSelector('h2:has-text("Мои эксперты")', { timeout: 5000 });

    // Click "Новый эксперт" button
    const newExpertBtn = page.getByRole("button", { name: /новый эксперт/i });
    await newExpertBtn.click();

    // Fill form
    const inputs = page.locator('input[placeholder*="Имя эксперта"]');
    await inputs.first().fill("Test Expert");

    const textareas = page.locator('textarea[placeholder*="Пример хорошего промпта"]');
    await textareas.first().fill("You are a helpful writing assistant. Provide clear and concise feedback.");

    // Add typical requests
    const addBtn = page.getByRole("button", { name: "+ Добавить" });
    await addBtn.click();

    const requestInputs = page.locator('input[placeholder*="напр. Улучшить"]');
    const lastInput = requestInputs.last();
    await lastInput.fill("Improve narrative flow");

    // Save
    const saveBtn = page.getByRole("button", { name: /сохранить|создать/i });
    await saveBtn.click();

    // Verify expert appears in list
    await page.waitForTimeout(1000);
    const expertName = page.locator("text=Test Expert");
    await expect(expertName).toBeVisible();
  });

  test("should edit existing expert", async ({ page }) => {
    // Open dialog
    const expertButton = await page.locator("button").filter({ hasText: /эксперт/i }).first();

    if (!expertButton) {
      test.skip();
    }

    await expertButton.click();
    await page.waitForSelector('h2:has-text("Мои эксперты")', { timeout: 5000 });

    // Get first expert's edit button (should be visible if expert exists)
    const editBtn = page.locator("button").filter({ hasText: /⚙️/ }).first();

    if (!editBtn) {
      test.skip();
    }

    await editBtn.click();

    // Form should be populated
    const nameInput = page.locator('input[placeholder*="Имя эксперта"]').first();
    const currentName = await nameInput.inputValue();

    // Change name
    await nameInput.clear();
    await nameInput.fill(currentName + " (Updated)");

    // Save
    const saveBtn = page.getByRole("button", { name: /сохранить/i });
    await saveBtn.click();

    // Verify update
    await page.waitForTimeout(1000);
    const updatedName = page.locator(`text=${currentName} (Updated)`);
    await expect(updatedName).toBeVisible();
  });

  test("should delete expert", async ({ page }) => {
    // Open dialog
    const expertButton = await page.locator("button").filter({ hasText: /эксперт/i }).first();

    if (!expertButton) {
      test.skip();
    }

    await expertButton.click();
    await page.waitForSelector('h2:has-text("Мои эксперты")', { timeout: 5000 });

    // Get expert name before deletion
    const expertItem = page.locator('[role="heading"]').filter({ hasText: /^[^\s]+/ }).first();
    const expertName = await expertItem.textContent();

    if (!expertName) {
      test.skip();
    }

    // Click delete button
    const deleteBtn = page.locator("button").filter({ hasText: "Удалить" }).first();
    await deleteBtn.click();

    // Confirm deletion
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.accept();
    });

    // Verify expert is removed
    await page.waitForTimeout(1000);
    const deletedName = page.locator(`text=${expertName}`);
    await expect(deletedName).not.toBeVisible();
  });
});
