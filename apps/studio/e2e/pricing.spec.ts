import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  const BASE_URL = "http://localhost:3001";

  test("pricing page loads and displays plans", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    // Check for main heading
    const heading = page.getByRole("heading", { name: /тарифні планы/i });
    await expect(heading).toBeVisible();
  });

  test("displays all four tariff tiers", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    // Check for plan names
    const planNames = ["Free", "Basic", "Pro", "Premium"];
    for (const name of planNames) {
      const planCard = page.getByRole("heading", { name, exact: true });
      await expect(planCard).toBeVisible({ timeout: 5000 });
    }
  });

  test("free plan shows correct price", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    const freeText = page.getByText("Бесплатно", { exact: true }).first();
    await expect(freeText).toBeVisible();
  });

  test("paid plans show prices in dollars", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    // Look for price displays with $ symbol
    const priceDisplays = await page.locator("text=/\\$\\d+\\.\\d{2}/").all();
    expect(priceDisplays.length).toBeGreaterThan(0);
  });

  test("subscribe buttons are present", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    // Look for subscribe/free buttons
    const freeButton = page.getByRole("button", {
      name: /начать бесплатно/i,
    });
    const subscribeButtons = page.getByRole("button", {
      name: /подписаться/i,
    });

    await expect(freeButton).toBeVisible();
    const subscribeCount = await subscribeButtons.count();
    expect(subscribeCount).toBeGreaterThan(0);
  });

  test("features are listed for each plan", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    // Check for feature lists with checkmarks
    const checkmarks = page
      .locator("svg")
      .filter({ has: page.locator("path") });
    const checkmarkCount = await checkmarks.count();
    expect(checkmarkCount).toBeGreaterThan(0);
  });

  test("FAQ section is visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    const faqHeading = page.getByRole("heading", {
      name: /часто задаваемые вопросы/i,
    });
    await expect(faqHeading).toBeVisible();
  });

  test("CTA section with login link is present", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForTimeout(2000);

    const ctaLink = page.getByRole("link", {
      name: /войти или создать аккаунт/i,
    });
    await expect(ctaLink).toBeVisible();
    expect(ctaLink).toHaveAttribute("href", "/login");
  });
});
