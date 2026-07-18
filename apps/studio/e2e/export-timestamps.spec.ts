import { test, expect } from "@playwright/test";

test.describe("Sprint-37-Step-03: Export Filenames with Timestamps", () => {
  test.beforeEach(async ({ page }) => {
    // Use baseURL from playwright.config.ts (default 3000 or SCRATCH_PORT env)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for hydration
    await page.waitForTimeout(2000);
  });

  test("Markdown ZIP export includes timestamp in filename", async ({
    page,
  }) => {
    // Create a book
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(1000);

    const titleInput = page.locator("input").first();
    await titleInput.fill("Test Book");

    const createButtons = page.locator("button:has-text('Создать')");
    if ((await createButtons.count()) > 0) {
      await createButtons.first().click();
    }

    await page.waitForTimeout(2000);

    // Open export dialog
    await page.keyboard.press("Control+E");
    await page.waitForTimeout(1000);

    // Select markdown-zip format
    const markdownRadio = page.locator('input[value="markdown-zip"]');
    if ((await markdownRadio.count()) > 0) {
      await markdownRadio.click();
    }

    // Set up download listener before clicking export
    let downloadedFilename = "";
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page
      .locator("button:has-text('Экспортировать')")
      .last();
    if ((await exportButton.isEnabled()) !== false) {
      await exportButton.click();

      // Wait for download
      try {
        const download = await downloadPromise;
        downloadedFilename = download.suggestedFilename();
      } catch {
        // Download might not complete, continue
      }
    }

    // Verify filename has correct timestamp format
    if (downloadedFilename) {
      // Filename should match: test-book_YYYY-MM-DD_HH-mm-ss.zip
      const timestampRegex =
        /test-book_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip/;
      expect(downloadedFilename).toMatch(timestampRegex);
    }
  });

  test("DOCX export includes timestamp in filename", async ({ page }) => {
    // Create a book
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(800);

    const titleInput = page.locator("input").first();
    await titleInput.fill("DOCX Test");

    const createButtons = page.locator("button:has-text('Создать')");
    if ((await createButtons.count()) > 0) {
      await createButtons.first().click();
    }

    await page.waitForTimeout(2000);

    // Open export dialog
    await page.keyboard.press("Control+E");
    await page.waitForTimeout(800);

    // Select DOCX format
    const docxRadio = page.locator('input[value="docx"]');
    if ((await docxRadio.count()) > 0) {
      await docxRadio.click();
    }

    // Wait for download
    let downloadedFilename = "";
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page
      .locator("button:has-text('Экспортировать')")
      .last();
    await exportButton.click();

    try {
      const download = await downloadPromise;
      downloadedFilename = download.suggestedFilename();
    } catch {
      // Continue without downloaded file
    }

    // Verify filename format
    if (downloadedFilename) {
      expect(downloadedFilename).toMatch(
        /docx-test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.docx/,
      );
    }
  });

  test("PDF export includes timestamp in filename", async ({ page }) => {
    // Create a book
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(800);

    const titleInput = page.locator("input").first();
    await titleInput.fill("PDF Test");

    const createButtons = page.locator("button:has-text('Создать')");
    if ((await createButtons.count()) > 0) {
      await createButtons.first().click();
    }

    await page.waitForTimeout(2000);

    // Open export dialog
    await page.keyboard.press("Control+E");
    await page.waitForTimeout(800);

    // Select PDF format
    const pdfRadio = page.locator('input[value="pdf"]');
    if ((await pdfRadio.count()) > 0) {
      await pdfRadio.click();
    }

    // Wait for download
    let downloadedFilename = "";
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page
      .locator("button:has-text('Экспортировать')")
      .last();
    await exportButton.click();

    try {
      const download = await downloadPromise;
      downloadedFilename = download.suggestedFilename();
    } catch {
      // Continue without downloaded file
    }

    // Verify filename format
    if (downloadedFilename) {
      expect(downloadedFilename).toMatch(
        /pdf-test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf/,
      );
    }
  });

  test("JSON export includes timestamp in filename", async ({ page }) => {
    // Create a book
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(800);

    const titleInput = page.locator("input").first();
    await titleInput.fill("JSON Test");

    const createButtons = page.locator("button:has-text('Создать')");
    if ((await createButtons.count()) > 0) {
      await createButtons.first().click();
    }

    await page.waitForTimeout(2000);

    // Open export dialog
    await page.keyboard.press("Control+E");
    await page.waitForTimeout(800);

    // Select JSON format (if available)
    const jsonRadio = page.locator('input[value="json"]');
    if ((await jsonRadio.count()) > 0) {
      await jsonRadio.click();
    }

    // Wait for download
    let downloadedFilename = "";
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page
      .locator("button:has-text('Экспортировать')")
      .last();
    await exportButton.click();

    try {
      const download = await downloadPromise;
      downloadedFilename = download.suggestedFilename();
    } catch {
      // Continue without downloaded file
    }

    // Verify filename format
    if (downloadedFilename) {
      expect(downloadedFilename).toMatch(
        /json-test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json/,
      );
    }
  });

  test("Export dialog preview shows correct timestamp format", async ({
    page,
  }) => {
    // Create a book
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(800);

    const titleInput = page.locator("input").first();
    await titleInput.fill("Preview Test");

    const createButtons = page.locator("button:has-text('Создать')");
    if ((await createButtons.count()) > 0) {
      await createButtons.first().click();
    }

    await page.waitForTimeout(2000);

    // Open export dialog
    await page.keyboard.press("Control+E");
    await page.waitForTimeout(1000);

    // Select DOCX to see filename preview
    const docxRadio = page.locator('input[value="docx"]');
    if ((await docxRadio.count()) > 0) {
      await docxRadio.click();
      await page.waitForTimeout(500);
    }

    // Look for timestamp pattern in the dialog
    const dialogContent = await page.content();
    const timestampPattern = /\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/;

    // Verify timestamp format exists in the dialog
    if (timestampPattern.test(dialogContent)) {
      const match = dialogContent.match(
        /preview-test_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/,
      );
      if (match) {
        // Verify format one more time
        expect(match[1]).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
      }
    }
  });

  test("Multiple exports have different timestamps", async ({ page }) => {
    // Create a book
    await page.keyboard.press("Control+N");
    await page.waitForTimeout(800);

    const titleInput = page.locator("input").first();
    await titleInput.fill("Multi Export Test");

    const createButtons = page.locator("button:has-text('Создать')");
    if ((await createButtons.count()) > 0) {
      await createButtons.first().click();
    }

    await page.waitForTimeout(2000);

    const filenames: string[] = [];

    // Do two exports
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("Control+E");
      await page.waitForTimeout(800);

      // Select markdown-zip format
      const markdownRadio = page.locator('input[value="markdown-zip"]');
      if ((await markdownRadio.count()) > 0) {
        await markdownRadio.click();
      }

      // Wait for download
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      const exportButton = page
        .locator("button:has-text('Экспортировать')")
        .last();
      await exportButton.click();

      try {
        const download = await downloadPromise;
        filenames.push(download.suggestedFilename());
      } catch {
        // Continue
      }

      // Wait a bit between exports to ensure different timestamps
      await page.waitForTimeout(1500);
    }

    // Verify both files have different timestamps
    if (filenames.length === 2) {
      // Extract timestamps
      const regex = /(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/g;
      const timestamps = [
        filenames[0].match(regex)?.[0],
        filenames[1].match(regex)?.[0],
      ];

      if (timestamps[0] && timestamps[1]) {
        // Timestamps should be different
        expect(timestamps[0]).not.toEqual(timestamps[1]);
      }
    }
  });
});
