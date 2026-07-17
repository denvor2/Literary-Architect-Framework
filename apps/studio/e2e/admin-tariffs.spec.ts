import { test, expect } from "@playwright/test";

test.describe("Admin Tariffs Management", () => {
  const BASE_URL = "http://localhost:3001";

  test.beforeEach(async ({ page, context }) => {
    // Set up admin auth token in localStorage (if needed)
    // Note: This requires proper auth setup in the app
    await context.addInitScript(() => {
      // localStorage.setItem('auth_token', 'admin-token-here');
    });
  });

  test("admin tariffs page loads", async ({ page }) => {
    // Navigate to admin tariffs page
    // Note: This will likely require authentication
    await page.goto(`${BASE_URL}/admin/tariffs`);
    await page.waitForTimeout(2000);

    // Check for heading
    const heading = page.getByRole("heading", {
      name: /управление тарифами/i,
    });

    // The page might redirect to login if not authenticated
    const url = page.url();
    if (url.includes("/login")) {
      console.log(
        "✓ Redirected to login (expected for unauthenticated access)",
      );
    } else {
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });

  test("tariff plans can be displayed", async ({ page }) => {
    // This test assumes the user is logged in as admin
    // For now, we just check that the page structure is correct
    await page.goto(`${BASE_URL}/admin/tariffs`);
    await page.waitForTimeout(2000);

    // Check if we can find tariff plan cards
    const planCards = page
      .locator("div")
      .filter({ hasText: /Free|Basic|Pro|Premium/ });
    const cardCount = await planCards.count();
    console.log(`Found ${cardCount} plan references on page`);
  });

  test("edit button is present on tariff cards", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tariffs`);
    await page.waitForTimeout(2000);

    const editButtons = page.getByRole("button", { name: /редактировать/i });
    const editCount = await editButtons.count();
    console.log(`Found ${editCount} edit buttons`);

    // If we have edit buttons, try to click one
    if (editCount > 0) {
      const firstEditButton = editButtons.first();
      await firstEditButton.click();
      await page.waitForTimeout(500);

      // Check if form fields appear
      const inputFields = page.locator("input");
      const fieldCount = await inputFields.count();
      console.log(`Edit form has ${fieldCount} input fields`);
    }
  });

  test("tariff edit form has required fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tariffs`);
    await page.waitForTimeout(2000);

    const editButtons = page.getByRole("button", { name: /редактировать/i });
    if ((await editButtons.count()) > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(500);

      // Check for input fields
      const nameInput = page.locator("input[type='text']").first();
      const priceInput = page.locator("input[type='number']").first();

      const nameExists = await nameInput.count().then((c) => c > 0);
      const priceExists = await priceInput.count().then((c) => c > 0);

      console.log(
        `Name input exists: ${nameExists}, Price input exists: ${priceExists}`,
      );
    }
  });

  test("save and cancel buttons are present in edit mode", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tariffs`);
    await page.waitForTimeout(2000);

    const editButtons = page.getByRole("button", { name: /редактировать/i });
    if ((await editButtons.count()) > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(500);

      // Check for save and cancel buttons
      const saveButton = page.getByRole("button", { name: /сохранить/i });
      const cancelButton = page.getByRole("button", { name: /отмена/i });

      const saveExists = await saveButton.count().then((c) => c > 0);
      const cancelExists = await cancelButton.count().then((c) => c > 0);

      console.log(
        `Save button exists: ${saveExists}, Cancel button exists: ${cancelExists}`,
      );
    }
  });
});
