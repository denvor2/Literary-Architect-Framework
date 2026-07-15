import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
});

test("DIAGNOSTIC: Trash persistence - full flow with logs", async ({ page }) => {
  const testTitle = `TrashTest ${Date.now()}`;

  console.log("\n" + "=".repeat(60));
  console.log("DIAGNOSTIC TEST: Trash Persistence Flow");
  console.log("=".repeat(60));

  // Collect browser console logs
  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[TRASH]")) {
      console.log(text);
      consoleLogs.push(text);
    }
  });

  // Step 1: Create book
  console.log("\n[TEST] STEP 1: Creating book...");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Find button more robustly
  const newBookBtn = page.getByRole("button", { name: /📖|Новая книга/i });
  await newBookBtn.click();

  await page.getByPlaceholder("Введите название...").fill(testTitle);
  await page.getByText("Создать книгу").click();
  await page.waitForTimeout(1000);

  // Verify book exists
  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByText(testTitle)).toBeVisible();
  console.log("[TEST] ✓ Book created");

  // Step 2: Delete book
  console.log("\n[TEST] STEP 2: Deleting book...");
  await page.waitForTimeout(500);
  const bookItem = sidebar.getByText(testTitle);
  await bookItem.hover();

  const deleteBtn = bookItem.locator("..").getByRole("button").last();
  await deleteBtn.click();
  await page.waitForTimeout(300);

  // Confirm deletion
  const confirmInput = page.getByPlaceholder(/Введите название книги/);
  if (await confirmInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmInput.fill(testTitle);
    await page.getByRole("button", { name: /Удалить/ }).click();
  }

  await page.waitForTimeout(1500);
  console.log("[TEST] ✓ Book deleted");

  // Step 3: Check trash BEFORE reload
  console.log("\n[TEST] STEP 3: Checking trash BEFORE reload...");
  const trashSection = sidebar.getByText(/Корзина/);
  const trashVisible = await trashSection.isVisible({ timeout: 2000 }).catch(() => false);
  console.log("[TEST] Trash section visible before reload:", trashVisible);

  // Step 4: Inspect localStorage before reload
  console.log("\n[TEST] STEP 4: Inspecting localStorage BEFORE reload...");
  const localStorageBefore = await page.evaluate(() => {
    const ephemeral = localStorage.getItem("literary-studio-ephemeral-state");
    if (ephemeral) {
      try {
        const parsed = JSON.parse(ephemeral);
        return {
          deletedBooksCount: parsed.deletedBooks?.length ?? 0,
          titles: parsed.deletedBooks?.map((b: any) => b.title) ?? [],
        };
      } catch {
        return { error: "Failed to parse" };
      }
    }
    return { deletedBooksCount: 0, titles: [] };
  });
  console.log("[TEST] localStorage BEFORE reload:", localStorageBefore);

  // Step 5: Reload page
  console.log("\n[TEST] STEP 5: Reloading page...");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  console.log("[TEST] ✓ Page reloaded");

  // Step 6: Inspect localStorage after reload
  console.log("\n[TEST] STEP 6: Inspecting localStorage AFTER reload...");
  const localStorageAfter = await page.evaluate(() => {
    const ephemeral = localStorage.getItem("literary-studio-ephemeral-state");
    if (ephemeral) {
      try {
        const parsed = JSON.parse(ephemeral);
        return {
          deletedBooksCount: parsed.deletedBooks?.length ?? 0,
          titles: parsed.deletedBooks?.map((b: any) => b.title) ?? [],
        };
      } catch {
        return { error: "Failed to parse" };
      }
    }
    return { deletedBooksCount: 0, titles: [] };
  });
  console.log("[TEST] localStorage AFTER reload:", localStorageAfter);

  // Step 7: Check trash section visibility
  console.log("\n[TEST] STEP 7: Checking trash AFTER reload...");
  const sidebarAfter = page.locator("aside").first();
  const trashAfter = sidebarAfter.getByText(/Корзина/);
  const trashVisibleAfter = await trashAfter.isVisible({ timeout: 2000 }).catch(() => false);
  console.log("[TEST] Trash section visible after reload:", trashVisibleAfter);

  // Step 8: Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  console.log("=".repeat(60));
  console.log("Before reload: deletedBooks count =", localStorageBefore.deletedBooksCount);
  console.log("After reload:  deletedBooks count =", localStorageAfter.deletedBooksCount);

  if (
    localStorageBefore.deletedBooksCount > 0 &&
    localStorageAfter.deletedBooksCount > 0
  ) {
    console.log("✅ PASS: deletedBooks persisted in localStorage!");
  } else {
    console.log("❌ FAIL: deletedBooks NOT persisted!");
    console.log("   - Before reload:", localStorageBefore);
    console.log("   - After reload:", localStorageAfter);
  }

  console.log("\nBrowser [TRASH] logs captured:");
  consoleLogs.forEach((log) => console.log("  " + log));
});
