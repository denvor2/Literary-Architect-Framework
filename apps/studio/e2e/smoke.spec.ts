import { test, expect } from "@playwright/test";

// Очищаем localStorage перед каждым тестом для изоляции
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe("Smoke: загрузка приложения", () => {
  test("страница загружается, Header виден", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByText("Literary Studio")).toBeVisible();
  });

  test("пустое состояние: нет книг, кнопка '+ Новая книга' видна", async ({
    page,
  }) => {
    await expect(page.getByText("+ Новая книга")).toBeVisible();
  });
});

test.describe("CRUD книги", () => {
  test("создание книги через диалог", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Тестовая книга");
    await page.getByText("Создать книгу").click();
    await expect(
      page.locator("aside").getByText("Тестовая книга"),
    ).toBeVisible();
  });

  test("создание главы", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Книга для глав");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();
    await expect(page.locator("aside").getByText("Chapter 1")).toBeVisible();
  });

  test("создание сцены в главе", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Книга для сцен");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();
    // Сцена создаётся автоматически с главой
    await expect(page.locator("textarea").first()).toBeVisible();
  });
});

test.describe("Редактирование текста", () => {
  test("ввод текста в сцену", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Редактирование");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();

    // unified view: берём первый scene textarea
    const sceneTextarea = page
      .locator("textarea[placeholder='Начните писать сцену...']")
      .first();
    await expect(sceneTextarea).toBeVisible();
    await sceneTextarea.fill("Это тестовый текст сцены.");
    await expect(sceneTextarea).toHaveValue("Это тестовый текст сцены.");
  });
});

test.describe("Навигация и сворачивание", () => {
  test("sidebar: дерево глав", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Дерево навигации");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();
    await page.getByText("+ Новая глава").click();

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText("Chapter 1")).toBeVisible();
    await expect(sidebar.getByText("Chapter 2")).toBeVisible();
  });

  test("сворачивание главы: сцены исчезают", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Сворачивание");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();

    // Scoped to first chapter block
    const chapterBlock = page.locator("[id^='chapter-block-']").first();
    const subtitleInput = chapterBlock.getByPlaceholder("Подзаголовок...");
    await expect(subtitleInput).toBeVisible();

    // Свернуть главу
    await chapterBlock
      .getByRole("button", { name: "Свернуть главу" })
      .click();

    // Subtitle исчезает в этой главе
    await expect(subtitleInput).not.toBeVisible();

    // Развернуть
    await chapterBlock
      .getByRole("button", { name: "Развернуть главу" })
      .click();
    await expect(subtitleInput).toBeVisible();
  });

  test("сворачивание сцены: textarea исчезает, title остаётся", async ({
    page,
  }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Сворачивание сцены");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();

    // Scene toggle кнопка в EditorArea
    const sceneBlock = page.locator("[id^='scene-block-']").first();
    const sceneToggle = sceneBlock.getByRole("button", {
      name: "Свернуть сцену",
    });
    await expect(sceneToggle).toBeVisible();

    // Свернуть сцену — textarea исчезает
    await sceneToggle.click();
    await expect(
      page.locator("textarea[placeholder='Начните писать сцену...']").first(),
    ).not.toBeVisible();

    // Title input остаётся видимым
    await expect(sceneBlock.locator("input").first()).toBeVisible();

    // Развернуть
    await sceneBlock
      .getByRole("button", { name: "Развернуть сцену" })
      .click();
    await expect(
      page.locator("textarea[placeholder='Начните писать сцену...']").first(),
    ).toBeVisible();
  });
});

test.describe("Focus Mode", () => {
  test("включение/выключение Focus Mode", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Фокус");
    await page.getByText("Создать книгу").click();

    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Focus Mode: кнопка в основном контенте
    const focusButton = page.getByRole("main").getByRole("button", {
      name: "Фокус",
    });
    await expect(focusButton).toBeVisible();
    await focusButton.click();
    await expect(sidebar).not.toBeVisible();

    // Выход из Focus Mode
    const exitButton = page.getByRole("main").getByRole("button", {
      name: "Выйти из фокуса",
    });
    await exitButton.click();
    await expect(sidebar).toBeVisible();
  });
});

test.describe("Персистентность данных", () => {
  test("книга сохраняется после перезагрузки", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Персистентность");
    await page.getByText("Создать книгу").click();
    await expect(
      page.locator("aside").getByText("Персистентность"),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.locator("aside").getByText("Персистентность"),
    ).toBeVisible();
  });

  test("текст сцены сохраняется после перезагрузки", async ({ page }) => {
    await page.getByText("+ Новая книга").click();
    await page.getByPlaceholder("Введите название...").fill("Текст");
    await page.getByText("Создать книгу").click();
    await page.getByText("+ Новая глава").click();

    // Ввести текст в scene textarea
    const sceneTextarea = page
      .locator("textarea[placeholder='Начните писать сцену...']")
      .first();
    await sceneTextarea.fill("Сохранённый текст.");

    await page.reload();

    // После перезагрузки scene textarea должен быть с текстом
    await expect(
      page.locator("textarea[placeholder='Начните писать сцену...']").first(),
    ).toHaveValue("Сохранённый текст.");
  });
});
