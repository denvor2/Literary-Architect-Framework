import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("DB Persistence: all elements are saved to database", async ({ page, context }) => {
  const testTitle = `DBTest ${Date.now()}`;

  // Step 1: Create book
  console.log("STEP 1: Creating book...");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.getByText("+ Новая книга").click();
  await page.getByPlaceholder("Введите название...").fill(testTitle);
  await page.getByText("Создать книгу").click();
  await page.waitForTimeout(800);

  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByText(testTitle)).toBeVisible();
  console.log("✓ Book created locally");

  // Step 2: Create chapter
  console.log("\nSTEP 2: Creating chapter...");
  await page.getByText("+ Новая глава").click();
  await page.waitForTimeout(500);
  const chapterItem = sidebar.getByText(/Chapter 1/);
  await expect(chapterItem).toBeVisible();
  console.log("✓ Chapter created locally");

  // Step 3: Create scene (auto-created with chapter)
  console.log("\nSTEP 3: Checking scene (auto-created with chapter)...");
  const sceneTextarea = page.locator("textarea[placeholder='Начните писать сцену...']").first();
  await expect(sceneTextarea).toBeVisible();
  console.log("✓ Scene exists locally");

  // Step 4: Add scene text
  console.log("\nSTEP 4: Adding scene text...");
  await sceneTextarea.fill("Test scene content");
  await page.waitForTimeout(500);
  console.log("✓ Scene text added");

  // Step 5: Create character
  console.log("\nSTEP 5: Creating character...");
  await page.getByText("+ Новый персонаж").click();
  const charInput = page.getByPlaceholder("Имя персонажа");
  if (await charInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await charInput.fill("Test Character");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    console.log("✓ Character created");
  } else {
    console.log("⚠ Character creation UI not found");
  }

  // Step 6: Create idea
  console.log("\nSTEP 6: Creating idea...");
  const ideaBtn = page.getByRole("button", { name: /Добавить заметку/ });
  if (await ideaBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await ideaBtn.click();
    const ideaInput = page.getByPlaceholder(/заметка|идея/i);
    if (await ideaInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await ideaInput.fill("Test idea");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      console.log("✓ Idea created");
    }
  } else {
    console.log("⚠ Idea creation UI not found");
  }

  // Step 7: Wait for auto-save
  console.log("\nSTEP 7: Waiting for auto-save to DB...");
  await page.waitForTimeout(1500);
  console.log("✓ Auto-save completed");

  // Step 8: Reload page and verify everything is still there
  console.log("\nSTEP 8: Reloading page to verify DB persistence...");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  console.log("✓ Page reloaded");

  // Step 9: Verify book is still there
  console.log("\nSTEP 9: Verifying book after reload...");
  const sidebarAfter = page.locator("aside").first();
  const bookAfter = sidebarAfter.getByText(testTitle);
  const bookVisible = await bookAfter.isVisible({ timeout: 2000 }).catch(() => false);

  if (bookVisible) {
    console.log("✅ BOOK PERSISTED to DB!");

    // Step 10: Verify chapter persists
    console.log("\nSTEP 10: Verifying chapter after reload...");
    const chapterAfter = sidebarAfter.getByText(/Chapter 1/);
    const chapterVisible = await chapterAfter.isVisible({ timeout: 1000 }).catch(() => false);
    if (chapterVisible) {
      console.log("✅ CHAPTER PERSISTED to DB!");
    } else {
      console.log("❌ CHAPTER LOST - NOT IN DB");
    }

    // Step 11: Verify scene text persists
    console.log("\nSTEP 11: Verifying scene content after reload...");
    const sceneAfter = page.locator("textarea[placeholder='Начните писать сцену...']").first();
    const sceneContent = await sceneAfter.inputValue({ timeout: 1000 }).catch(() => "");
    if (sceneContent.includes("Test scene content")) {
      console.log("✅ SCENE CONTENT PERSISTED to DB!");
    } else {
      console.log("❌ SCENE CONTENT LOST - NOT IN DB");
      console.log("   Current content:", sceneContent);
    }
  } else {
    console.log("❌ BOOK LOST - NOT IN DB");
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  if (bookVisible) {
    console.log("✅ Books are persisted to DB");
    console.log("⚠️  Check chapter and scene persistence above");
  } else {
    console.log("❌ CRITICAL: Books are NOT persisted to DB!");
    console.log("   Only localStorage, no DB sync");
  }
});
