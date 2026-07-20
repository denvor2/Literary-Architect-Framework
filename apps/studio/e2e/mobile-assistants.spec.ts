import { test, expect } from "@playwright/test";

test.describe("Mobile Assistants Layout (Sprint-39-Step-06)", () => {
  test("should display assistants panel correctly on 375px (small phone)", async ({
    page,
  }) => {
    // Set viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to app
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Check if AssistantPanel exists
    const panel = await page.$("aside");
    expect(panel).toBeTruthy();

    // Check for textarea (main input element in AssistantPanel)
    const textarea = await page.$("textarea");
    expect(textarea).toBeTruthy();
  });

  test("should display grid-cols-1 layout on 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Check for grid-cols-1 on small screens (375px)
    // This verifies the 1-column layout for quick commands
    const gridDivs = await page.$$("div[class*='grid-cols-1']");
    expect(gridDivs.length).toBeGreaterThan(0);

    // Verify these grids also have sm:grid-cols-2 (responsive design)
    const responsiveGrids = await page.$$(
      "div[class*='grid-cols-1'][class*='sm:grid-cols-2']",
    );
    expect(responsiveGrids.length).toBeGreaterThan(0);
  });

  test("should display sm:grid-cols-2 classes for responsive 2-column layout", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 854 });
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Check for sm:grid-cols-2 classes (responsive 2-column on sm+ breakpoint)
    const gridDivs = await page.$$("div[class*='sm:grid-cols-2']");
    expect(gridDivs.length).toBeGreaterThan(0);
  });

  test("should display textarea and Ask button for input on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Check for textarea
    const textarea = await page.$("textarea");
    expect(textarea).toBeTruthy();

    // Check for Ask button (text-based selector, actual element in component)
    const askButton = await page.$("button:has-text('Ask')");
    expect(askButton).toBeTruthy();
  });

  test("should allow textarea input on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Type in textarea
    const textarea = await page.$("textarea");
    if (textarea) {
      await textarea.fill("Test input for assistants");
      const value = await textarea.inputValue();
      expect(value).toBe("Test input for assistants");
    }
  });

  test("should have no horizontal scroll on 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Check body overflow
    const bodyOverflow = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return scrollWidth > clientWidth;
    });

    // Should not have horizontal scroll
    expect(bodyOverflow).toBeFalsy();
  });

  test("should display responsive layout on 640px (tablet)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto("http://localhost:3000");

    // Wait for app to load
    await page.waitForSelector("[role='main']", { timeout: 5000 });

    // Check if AssistantPanel exists and is responsive
    const panel = await page.$("aside");
    expect(panel).toBeTruthy();

    // Should still have textarea
    const textarea = await page.$("textarea");
    expect(textarea).toBeTruthy();

    // No horizontal scroll at tablet viewport either
    const bodyOverflow = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return scrollWidth > clientWidth;
    });
    expect(bodyOverflow).toBeFalsy();
  });
});
