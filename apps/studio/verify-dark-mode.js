const { chromium } = require("playwright");

// WCAG Contrast Ratio Calculator
function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseHexColor(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function calculateContrast(color1, color2) {
  const c1 = parseHexColor(color1);
  const c2 = parseHexColor(color2);
  const l1 = getRelativeLuminance(c1.r, c1.g, c1.b);
  const l2 = getRelativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function verifyDarkMode() {
  console.log("\n=== INDEPENDENT DARK MODE VERIFICATION ===\n");

  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const context = await browser.createContext();
    const page = await context.newPage();

    // Test 1: Light Mode Variables
    console.log("Test 1: Light Mode CSS Variables and Contrast");
    console.log("=============================================");
    await page.goto("http://localhost:3456/");

    // Force light mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(300);

    const lightVars = await page.evaluate(() => {
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

    console.log("Light Mode CSS Variables:");
    Object.entries(lightVars).forEach(([key, value]) => {
      console.log(
        `  --${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`,
      );
    });

    // Verify light mode colors
    const lightMatch =
      lightVars.background === "#ffffff" &&
      lightVars.foreground === "#171717" &&
      lightVars.accent === "#2563eb";
    console.log(
      `\nLight Mode Colors Match ARP: ${lightMatch ? "✓ PASS" : "✗ FAIL"}`,
    );

    // Calculate light mode contrast
    const lightContrasts = {
      "main-text": calculateContrast(
        lightVars.foreground,
        lightVars.background,
      ),
      "accent-on-bg": calculateContrast(lightVars.accent, lightVars.background),
      "muted-text": calculateContrast(
        lightVars.mutedForeground,
        lightVars.muted,
      ),
      "input-text": calculateContrast(lightVars.foreground, lightVars.inputBg),
    };

    console.log("\nLight Mode Contrast Ratios (WCAG AA = 4.5:1):");
    let lightContrastPass = true;
    Object.entries(lightContrasts).forEach(([key, value]) => {
      const pass = value >= 4.5;
      lightContrastPass = lightContrastPass && pass;
      console.log(`  ${key}: ${value.toFixed(2)}:1 ${pass ? "✓" : "✗"}`);
    });

    // Test 2: Dark Mode Variables
    console.log("\n\nTest 2: Dark Mode CSS Variables and Contrast");
    console.log("==========================================");

    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(300);

    const darkVars = await page.evaluate(() => {
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

    console.log("Dark Mode CSS Variables:");
    Object.entries(darkVars).forEach(([key, value]) => {
      console.log(
        `  --${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`,
      );
    });

    // Verify dark mode colors
    const darkColorMatch =
      darkVars.background === "#09090b" &&
      darkVars.foreground === "#f4f4f5" &&
      darkVars.accent === "#3b82f6" &&
      darkVars.inputBg === "#18181b" &&
      darkVars.inputBorder === "#3f3f46" &&
      darkVars.success === "#22c55e" &&
      darkVars.error === "#ef4444";

    console.log(
      `\nDark Mode Colors Match ARP: ${darkColorMatch ? "✓ PASS" : "✗ FAIL"}`,
    );

    if (!darkColorMatch) {
      console.log("\nExpected vs Actual:");
      console.log(`  background: #09090b vs ${darkVars.background}`);
      console.log(`  foreground: #f4f4f5 vs ${darkVars.foreground}`);
      console.log(`  accent: #3b82f6 vs ${darkVars.accent}`);
    }

    // Calculate dark mode contrast
    const darkContrasts = {
      "main-text": calculateContrast(darkVars.foreground, darkVars.background),
      "input-text": calculateContrast(darkVars.foreground, darkVars.inputBg),
      "muted-text": calculateContrast(darkVars.mutedForeground, darkVars.muted),
      "accent-on-bg": calculateContrast(darkVars.accent, darkVars.background),
      "success-on-bg": calculateContrast(darkVars.success, darkVars.background),
      "error-on-bg": calculateContrast(darkVars.error, darkVars.background),
      "info-on-bg": calculateContrast(darkVars.info, darkVars.background),
      "warning-on-bg": calculateContrast(darkVars.warning, darkVars.background),
    };

    console.log("\nDark Mode Contrast Ratios (WCAG AA = 4.5:1):");
    let darkContrastPass = true;
    Object.entries(darkContrasts).forEach(([key, value]) => {
      const pass = value >= 4.5;
      darkContrastPass = darkContrastPass && pass;
      console.log(`  ${key}: ${value.toFixed(2)}:1 ${pass ? "✓" : "✗"}`);
    });

    // Test 3: Component Visibility
    console.log("\n\nTest 3: Component Visibility in Dark Mode");
    console.log("========================================");

    const componentVisibility = await page.evaluate(() => {
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const body = document.body;
      const style = window.getComputedStyle(body);

      return {
        headerVisible: header !== null,
        mainVisible: main !== null,
        bodyBgColor: style.backgroundColor,
        bodyTextColor: style.color,
      };
    });

    console.log("Component Check:");
    console.log(
      `  Header present: ${componentVisibility.headerVisible ? "✓" : "✗"}`,
    );
    console.log(
      `  Main present: ${componentVisibility.mainVisible ? "✓" : "✗"}`,
    );
    console.log(`  Body background-color: ${componentVisibility.bodyBgColor}`);
    console.log(`  Body text color: ${componentVisibility.bodyTextColor}`);

    // Test 4: Rapid Theme Switching
    console.log("\n\nTest 4: Rapid Theme Switching (Edge Case)");
    console.log("======================================");

    let switchPass = true;
    for (let i = 0; i < 3; i++) {
      // Light
      await page.emulateMedia({ colorScheme: "light" });
      await page.waitForTimeout(50);

      const lightBg = await page.evaluate(() =>
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim(),
      );

      // Dark
      await page.emulateMedia({ colorScheme: "dark" });
      await page.waitForTimeout(50);

      const darkBg = await page.evaluate(() =>
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim(),
      );

      const pass = lightBg === "#ffffff" && darkBg === "#09090b";
      switchPass = switchPass && pass;
      console.log(
        `  Switch ${i + 1}: Light=${lightBg} Dark=${darkBg} ${pass ? "✓" : "✗"}`,
      );
    }

    // Final Report
    console.log("\n\n=== FINAL VERIFICATION REPORT ===");
    console.log("================================");

    const overallPass =
      lightMatch &&
      lightContrastPass &&
      darkColorMatch &&
      darkContrastPass &&
      switchPass;

    console.log(
      `\nLight Mode CSS Variables: ${lightMatch ? "✓ PASS" : "✗ FAIL"}`,
    );
    console.log(
      `Light Mode Contrast: ${lightContrastPass ? "✓ PASS" : "✗ FAIL"}`,
    );
    console.log(
      `Dark Mode CSS Variables: ${darkColorMatch ? "✓ PASS" : "✗ FAIL"}`,
    );
    console.log(
      `Dark Mode Contrast: ${darkContrastPass ? "✓ PASS" : "✗ FAIL"}`,
    );
    console.log(`Rapid Switching: ${switchPass ? "✓ PASS" : "✗ FAIL"}`);

    console.log(`\nOverall Status: ${overallPass ? "✓ PASS" : "✗ FAIL"}`);

    if (!overallPass) {
      console.log("\nFailure details:");
      if (!lightMatch) console.log("  - Light mode colors don't match ARP");
      if (!lightContrastPass)
        console.log("  - Light mode contrast below WCAG AA");
      if (!darkColorMatch) console.log("  - Dark mode colors don't match ARP");
      if (!darkContrastPass)
        console.log("  - Dark mode contrast below WCAG AA");
      if (!switchPass) console.log("  - Theme switching failed");
    }

    process.exit(overallPass ? 0 : 1);
  } catch (error) {
    console.error("Error during verification:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyDarkMode();
