import { test, expect, chromium } from "@playwright/test";

// WCAG Contrast Ratio Calculator
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function calculateContrast(color1: string, color2: string): number {
  const c1 = parseHexColor(color1);
  const c2 = parseHexColor(color2);
  const l1 = getRelativeLuminance(c1.r, c1.g, c1.b);
  const l2 = getRelativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Dark Mode Contrast & Color Verification", () => {
  test("Light Mode: CSS Variables and Contrast Ratios", async ({ page }) => {
    await page.goto("http://localhost:3456/");

    // Clear any dark mode preference to force light mode
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent = "@media (prefers-color-scheme: dark) { :root { } }";
      document.head.appendChild(style);
    });

    // Remove dark mode media query to ensure light mode
    await page.evaluate(() => {
      const htmlElement = document.documentElement;
      htmlElement.style.colorScheme = "light";
    });

    await page.waitForTimeout(500);

    // Get computed CSS variables in light mode
    const lightVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const style = window.getComputedStyle(root);
      return {
        background: style.getPropertyValue("--background").trim(),
        foreground: style.getPropertyValue("--foreground").trim(),
        border: style.getPropertyValue("--border").trim(),
        inputBg: style.getPropertyValue("--input-bg").trim(),
        inputBorder: style.getPropertyValue("--input-border").trim(),
        muted: style.getPropertyValue("--muted").trim(),
        mutedForeground: style.getPropertyValue("--muted-foreground").trim(),
        accent: style.getPropertyValue("--accent").trim(),
        accentForeground: style.getPropertyValue("--accent-foreground").trim(),
        success: style.getPropertyValue("--success").trim(),
        warning: style.getPropertyValue("--warning").trim(),
        error: style.getPropertyValue("--error").trim(),
        info: style.getPropertyValue("--info").trim(),
      };
    });

    console.log("Light Mode CSS Variables:", lightVariables);

    // Verify light mode colors match ARP claims
    expect(lightVariables.background).toBe("#ffffff");
    expect(lightVariables.foreground).toBe("#171717");
    expect(lightVariables.accent).toBe("#2563eb");

    // Calculate and verify contrast ratios for light mode
    const lightContrasts = {
      mainText: calculateContrast(lightVariables.foreground, lightVariables.background),
      accentText: calculateContrast(lightVariables.accent, lightVariables.background),
      mutedText: calculateContrast(lightVariables.mutedForeground, lightVariables.muted),
      inputText: calculateContrast(lightVariables.foreground, lightVariables.inputBg),
    };

    console.log("Light Mode Contrast Ratios:", lightContrasts);

    // Verify WCAG AA compliance (4.5:1 minimum)
    expect(lightContrasts.mainText).toBeGreaterThanOrEqual(4.5);
    expect(lightContrasts.accentText).toBeGreaterThanOrEqual(4.5);
    expect(lightContrasts.mutedText).toBeGreaterThanOrEqual(4.5);
    expect(lightContrasts.inputText).toBeGreaterThanOrEqual(4.5);
  });

  test("Dark Mode: CSS Variables and Contrast Ratios", async ({ page }) => {
    await page.goto("http://localhost:3456/");

    // Force dark mode preference
    await page.evaluate(() => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (!mediaQuery.matches) {
        // Try to force dark mode via HTML attribute
        document.documentElement.style.colorScheme = "dark";
      }
    });

    // Use emulateMedia to force dark color scheme
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(500);

    // Get computed CSS variables in dark mode
    const darkVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const style = window.getComputedStyle(root);
      return {
        background: style.getPropertyValue("--background").trim(),
        foreground: style.getPropertyValue("--foreground").trim(),
        border: style.getPropertyValue("--border").trim(),
        inputBg: style.getPropertyValue("--input-bg").trim(),
        inputBorder: style.getPropertyValue("--input-border").trim(),
        muted: style.getPropertyValue("--muted").trim(),
        mutedForeground: style.getPropertyValue("--muted-foreground").trim(),
        accent: style.getPropertyValue("--accent").trim(),
        accentForeground: style.getPropertyValue("--accent-foreground").trim(),
        success: style.getPropertyValue("--success").trim(),
        warning: style.getPropertyValue("--warning").trim(),
        error: style.getPropertyValue("--error").trim(),
        info: style.getPropertyValue("--info").trim(),
      };
    });

    console.log("Dark Mode CSS Variables:", darkVariables);

    // Verify dark mode colors match ARP claims
    expect(darkVariables.background).toBe("#09090b");
    expect(darkVariables.foreground).toBe("#f4f4f5");
    expect(darkVariables.accent).toBe("#3b82f6");
    expect(darkVariables.inputBg).toBe("#18181b");
    expect(darkVariables.inputBorder).toBe("#3f3f46");
    expect(darkVariables.success).toBe("#22c55e");
    expect(darkVariables.error).toBe("#ef4444");

    // Calculate and verify contrast ratios for dark mode
    const darkContrasts = {
      mainText: calculateContrast(darkVariables.foreground, darkVariables.background),
      inputText: calculateContrast(darkVariables.foreground, darkVariables.inputBg),
      mutedText: calculateContrast(
        darkVariables.mutedForeground,
        darkVariables.muted
      ),
      accentText: calculateContrast(darkVariables.accent, darkVariables.background),
      successText: calculateContrast(darkVariables.success, darkVariables.background),
      errorText: calculateContrast(darkVariables.error, darkVariables.background),
      infoText: calculateContrast(darkVariables.info, darkVariables.background),
      warningText: calculateContrast(
        darkVariables.warning,
        darkVariables.background
      ),
    };

    console.log("Dark Mode Contrast Ratios:", darkContrasts);

    // Verify WCAG AA compliance (4.5:1 minimum for normal text)
    expect(darkContrasts.mainText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.inputText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.mutedText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.accentText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.successText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.errorText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.infoText).toBeGreaterThanOrEqual(4.5);
    expect(darkContrasts.warningText).toBeGreaterThanOrEqual(4.5);

    // Log detailed report
    console.log("\n=== DARK MODE VERIFICATION REPORT ===");
    console.log("CSS Variables Match ARP: ✓");
    console.log("All Colors Present: ✓");
    console.log("\nContrast Ratios (WCAG AA = 4.5:1):");
    Object.entries(darkContrasts).forEach(([key, value]) => {
      const ratio = value.toFixed(2);
      const status = value >= 4.5 ? "✓" : "✗";
      console.log(`  ${key}: ${ratio}:1 ${status}`);
    });
  });

  test("Dark Mode: Component Visibility", async ({ page }) => {
    await page.goto("http://localhost:3456/");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(500);

    // Verify basic structure is visible
    const header = await page.locator("header").isVisible();
    const main = await page.locator("main").isVisible();
    const body = page.locator("body");

    const bodyComputedStyle = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });

    console.log("Body computed style (dark mode):", bodyComputedStyle);

    expect(header).toBeTruthy();
    expect(main).toBeTruthy();
    expect(bodyComputedStyle.backgroundColor).toBeTruthy();
    expect(bodyComputedStyle.color).toBeTruthy();

    // Verify text is readable
    const headerText = await page.locator("header").textContent();
    console.log("Header visible text:", headerText);
    expect(headerText).toBeTruthy();
  });

  test("Dark Mode: Edge Case - Rapid Mode Switching", async ({ page }) => {
    await page.goto("http://localhost:3456/");

    for (let i = 0; i < 3; i++) {
      // Switch to light
      await page.emulateMedia({ colorScheme: "light" });
      await page.waitForTimeout(100);

      const lightBg = await page.locator("body").evaluate(() => {
        return window.getComputedStyle(document.documentElement).getPropertyValue("--background");
      });

      // Switch to dark
      await page.emulateMedia({ colorScheme: "dark" });
      await page.waitForTimeout(100);

      const darkBg = await page.locator("body").evaluate(() => {
        return window.getComputedStyle(document.documentElement).getPropertyValue("--background");
      });

      console.log(`Switch ${i + 1}: Light BG=${lightBg.trim()}, Dark BG=${darkBg.trim()}`);
      expect(lightBg.trim()).toBe("#ffffff");
      expect(darkBg.trim()).toBe("#09090b");
    }
  });

  test("Dark Mode: Input Fields Visibility", async ({ page }) => {
    await page.goto("http://localhost:3456/");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(500);

    // Check if any inputs exist and are styled
    const hasInputs = await page.locator("input").count().then((count) => count > 0);

    if (hasInputs) {
      const firstInput = page.locator("input").first();
      const inputStyle = await firstInput.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          color: style.color,
        };
      });
      console.log("Input field style (dark mode):", inputStyle);
      expect(inputStyle.backgroundColor).toBeTruthy();
    }
  });
});
