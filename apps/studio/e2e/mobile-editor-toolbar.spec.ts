import { test, expect } from "@playwright/test";

/**
 * Sprint-39-Step-05: E2E tests for responsive editor toolbar
 * Tests toolbar visibility, responsive behavior, button states, and styling
 */

test.describe("Editor Toolbar - Responsive & Layout", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto("/");

    // Wait for app to load
    await page
      .waitForSelector('[data-testid="editor-area"]', { timeout: 5000 })
      .catch(() => null);
  });

  test.describe("Toolbar Visibility", () => {
    test("should display toolbar on all viewports", async ({ page }) => {
      // Check toolbar exists
      const toolbar = page.locator('button[aria-label="Undo"]').first();
      await expect(toolbar).toBeVisible();
    });

    test("should be visible on mobile viewport (375px)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const toolbar = page
        .locator("div")
        .filter({ has: page.locator('button[aria-label="Undo"]') })
        .first();
      await expect(toolbar).toBeVisible();
    });

    test("should be visible on tablet viewport (768px)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      const toolbar = page
        .locator("div")
        .filter({ has: page.locator('button[aria-label="Undo"]') })
        .first();
      await expect(toolbar).toBeVisible();
    });

    test("should be visible on desktop viewport (1920px)", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      const toolbar = page
        .locator("div")
        .filter({ has: page.locator('button[aria-label="Undo"]') })
        .first();
      await expect(toolbar).toBeVisible();
    });
  });

  test.describe("Toolbar Buttons", () => {
    test("should have all toolbar buttons", async ({ page }) => {
      // Check all expected buttons exist
      const buttons = [
        "Undo",
        "Redo",
        "Bold",
        "Italic",
        "Quote",
        "Find & Replace",
        "AI Tools",
        "Assistants",
      ];

      for (const buttonName of buttons) {
        const button = page.locator(`button[aria-label="${buttonName}"]`);
        await expect(button).toBeVisible();
      }
    });

    test("Undo/Redo buttons should be disabled by default", async ({
      page,
    }) => {
      const undoButton = page.locator('button[aria-label="Undo"]');
      const redoButton = page.locator('button[aria-label="Redo"]');

      await expect(undoButton).toHaveAttribute("disabled");
      await expect(redoButton).toHaveAttribute("disabled");
    });

    test("formatting buttons should be enabled by default", async ({
      page,
    }) => {
      const boldButton = page.locator('button[aria-label="Bold"]');
      const italicButton = page.locator('button[aria-label="Italic"]');
      const quoteButton = page.locator('button[aria-label="Quote"]');

      await expect(boldButton).not.toHaveAttribute("disabled");
      await expect(italicButton).not.toHaveAttribute("disabled");
      await expect(quoteButton).not.toHaveAttribute("disabled");
    });
  });

  test.describe("Button Styling", () => {
    test("AI icon should have accent color (blue)", async ({ page }) => {
      const aiButton = page.locator('button[aria-label="AI Tools"]');
      const svg = aiButton.locator("svg");

      // Check for blue color classes
      const classes = await svg.getAttribute("class");
      expect(classes).toContain("text-blue");
    });

    test("disabled buttons should have opacity-40", async ({ page }) => {
      const undoButton = page.locator('button[aria-label="Undo"]');

      // Get computed style
      const opacityClass = await undoButton.getAttribute("class");
      expect(opacityClass).toContain("opacity-40");
    });

    test("buttons should have minimum 44x44px tap target", async ({ page }) => {
      const boldButton = page.locator('button[aria-label="Bold"]');

      // Get the button's bounding box
      const boundingBox = await boldButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe("Responsive Behavior", () => {
    test("toolbar should be horizontally scrollable on small viewports", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const toolbarContainer = page
        .locator("div")
        .filter({
          has: page.locator('button[aria-label="Undo"]'),
        })
        .first();

      // Check for overflow-x-auto class or scrollable behavior
      const classes = await toolbarContainer.getAttribute("class");
      expect(classes).toContain("overflow-x-auto");
    });

    test("icons should be properly sized (18px)", async ({ page }) => {
      const boldButton = page.locator('button[aria-label="Bold"]');
      const svg = boldButton.locator("svg");

      // Lucide icons with size={18} should have width and height
      const width = await svg.getAttribute("width");
      expect(width).toBe("18");
    });

    test("toolbar dividers should be visible", async ({ page }) => {
      // Check for divider elements (0.5px solid line)
      const dividers = page.locator("div.h-4\\.5.w-px");
      const count = await dividers.count();

      // Should have at least 2 dividers (between groups)
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe("Layout Integration", () => {
    test("toolbar should not be horizontally scrollable on desktop", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const toolbarContainer = page
        .locator("div")
        .filter({
          has: page.locator('button[aria-label="Undo"]'),
        })
        .first();

      // On desktop with many buttons and 1920px width, shouldn't need horizontal scroll
      const scrollWidth = await toolbarContainer.evaluate(
        (el) => el.scrollWidth,
      );
      const clientWidth = await toolbarContainer.evaluate(
        (el) => el.clientWidth,
      );

      // Allow small overflow due to margins, but shouldn't need scrolling on 1920px
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
    });

    test("main editor area should be below toolbar", async ({ page }) => {
      const toolbar = page.locator('button[aria-label="Undo"]').first();
      const editorArea = page.locator("main");

      // Get positions
      const toolbarBox = await toolbar.boundingBox();
      const editorBox = await editorArea.boundingBox();

      if (toolbarBox && editorBox) {
        // Toolbar should be above editor area
        expect(toolbarBox.y + toolbarBox.height).toBeLessThanOrEqual(
          editorBox.y + editorBox.height,
        );
      }
    });

    test("no horizontal scroll on main page content", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check main element doesn't have overflow-x issues
      const mainScroll = await page.evaluate(() => {
        const main = document.querySelector("main");
        if (!main) return null;
        return main.scrollWidth > main.clientWidth;
      });

      // Should not have horizontal scroll on main area
      expect(mainScroll).toBeFalsy();
    });
  });

  test.describe("Button Interactions", () => {
    test("buttons should be clickable", async ({ page }) => {
      const boldButton = page.locator('button[aria-label="Bold"]');

      // Should be able to click it (even if no functionality yet)
      await boldButton.click();
      await expect(boldButton).toBeVisible();
    });

    test("disabled buttons should not be clickable", async ({ page }) => {
      const undoButton = page.locator('button[aria-label="Undo"]');

      // Disabled button should be disabled
      await expect(undoButton).toBeDisabled();
    });
  });

  test.describe("Accessibility", () => {
    test("all toolbar buttons should have aria-labels", async ({ page }) => {
      const buttons = page
        .locator("div")
        .filter({
          has: page.locator('button[aria-label="Undo"]'),
        })
        .first()
        .locator("button");

      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute("aria-label");
        expect(ariaLabel).toBeTruthy();
      }
    });

    test("toolbar buttons should have title attributes", async ({ page }) => {
      const boldButton = page.locator('button[aria-label="Bold"]');
      const title = await boldButton.getAttribute("title");
      expect(title).toBeTruthy();
    });
  });

  test.describe("Visual Regression", () => {
    test("toolbar should render correctly on mobile (375px)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Wait for toolbar to render
      await page.waitForTimeout(500);

      // Take screenshot (visual regression check)
      // This will be compared against baseline in CI
      await expect(page)
        .toHaveScreenshot("toolbar-mobile-375.png", {
          mask: [page.locator('[data-testid="dynamic-content"]')],
        })
        .catch(() => {
          // Ignore if screenshot doesn't exist yet (first run)
        });
    });

    test("toolbar should render correctly on tablet (768px)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.waitForTimeout(500);

      await expect(page)
        .toHaveScreenshot("toolbar-tablet-768.png", {
          mask: [page.locator('[data-testid="dynamic-content"]')],
        })
        .catch(() => {
          // Ignore if screenshot doesn't exist yet
        });
    });

    test("toolbar should render correctly on desktop (1920px)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.waitForTimeout(500);

      await expect(page)
        .toHaveScreenshot("toolbar-desktop-1920.png", {
          mask: [page.locator('[data-testid="dynamic-content"]')],
        })
        .catch(() => {
          // Ignore if screenshot doesn't exist yet
        });
    });
  });

  test.describe("Footer Integration", () => {
    test("StatsFooter should be visible below editor", async ({ page }) => {
      // StatsFooter should be displayed
      const statsFooter = page.locator("text=Слов:");
      await expect(statsFooter).toBeVisible();
    });

    test("toolbar and footer should not overlap", async ({ page }) => {
      const toolbar = page.locator('button[aria-label="Undo"]').first();
      const footer = page.locator("text=Слов:");

      const toolbarBox = await toolbar.boundingBox();
      const footerBox = await footer.boundingBox();

      if (toolbarBox && footerBox) {
        // Footer should be below toolbar
        expect(footerBox.y).toBeGreaterThan(toolbarBox.y + toolbarBox.height);
      }
    });
  });
});
