id: Sprint-15-Step-02
name: "Аудит и перевод оставшегося английского UI-текста"
type: implementation

## Scope

Allowed paths:
- `apps/studio/src/components/AssistantPanel.tsx`
- `apps/studio/src/components/EditorArea.tsx`
- `apps/studio/src/components/NewBookDialog.tsx`
- `apps/studio/src/components/CharacterPanel.tsx`
- `apps/studio/src/components/Sidebar.tsx`
- `apps/studio/src/components/Header.tsx`
- `apps/studio/src/components/DeveloperTools.tsx`
- `apps/studio/src/components/LineEditorPanel.tsx`
- `apps/studio/src/components/TestConnectionButton.tsx`
- `apps/studio/src/app/layout.tsx` (только атрибут `lang`, не `title`/`description` — см. ниже)

Forbidden paths:
- всё остальное. Логика не меняется — только текстовые литералы (placeholder, label, кнопки,
  заголовки, сообщения).

## Objective

Перевести оставшийся английский UI-текст на русский (второй и последний пункт Sprint 15, по
`docs/vision/SPRINT_ROADMAP.md`), доведя написанное на русском до консистентности — часть UI
(например, кнопка "Спросить", "Фокус", "Удалить персонажа") уже по-русски, часть — по-английски
(смешанное состояние, унаследованное с разных спринтов).

## Инвентаризация (grep по `apps/studio/src/components/` и `app/`)

Полный список найденных английских строк — построчно по файлам, см. раздел "Что сделать".

## Что НЕ переводится (сознательные исключения)

- **`AssistantMode`-ключи** (`"coauthor"|"editor"|"critic"|"reader"`) — доменные литералы,
  используются как ключи объектов и в сравнениях, не отображаются пользователю напрямую. Не
  трогать.
- **`GENRES`/`LANGUAGES` массивы в `NewBookDialog.tsx`** — данные, не просто UI-текст:
  `LANGUAGES`' значения — это буквально то, что теперь (Step 01) уходит в AI как `bookLanguage`
  ("Respond in ${bookLanguage}") — оставить английскими именами языков. `GENRES` — по аналогии,
  та же природа (значение `Book.genre`, не просто подпись). Тот же принцип, что уже применён к
  Critic's `category`/`severity` enum в Step 01 — не переводить структурные/схемные значения.
- **`review.category ?? "General"`** (`AssistantPanel.tsx`) — фолбэк ровно под фиксированный
  enum из системного промпта Critic'а (`"Plot"|"Characters"|...|"General"`), не UI-копия сама
  по себе.
- **`app/layout.tsx`'s `title: "Literary Studio"` и `description: "An AI-powered IDE for
  writers."`** — по `docs/project/HANDOVER.md`'s "Preferred terminology" оба зафиксированы как
  предпочитаемые англоязычные термины проекта (название продукта и его английский слоган),
  сознательно не переводятся.
- **Сырые сообщения об ошибках из `err.message`** (реальный текст ошибки JS/сети) — не
  переводятся, это данные времени выполнения, не наш текст. Переводятся только фолбэк-константы
  (`"Request failed."` и т.п.).

## Что сделать (файл → строки)

- **`AssistantPanel.tsx`**: `MODE_META` labels ("Co-author"→"Соавтор", "Editor"→"Редактор",
  "Critic"→"Критик", "Reader"→"Читатель") и их `description`; "Create your first book to talk to
  an assistant." ; "No issues found." ; "Assistant unavailable. Try again." (оба места, основной
  `handleSend` и `ReaderPanel`'s).
- **`EditorArea.tsx`**: "Create your first book to get started"; "Scene title..."; "Exit Focus";
  "Start writing your scene..."; "Words:"/"Characters:" в счётчике; "Chapter title...";
  "Subtitle..."; "No scenes yet"; "New Scene"; "Book title..."; "What is this book about?";
  "Tags (comma-separated)..."; "Short annotation..."; "Full annotation..."; "Chapters"
  (заголовок); "No chapters yet".
- **`NewBookDialog.tsx`**: "New Book" (заголовок); "Book Title"; "Enter a title..."; "Genre";
  "Language"; "Premise / Idea"; "What is this book about?"; "Cancel"; "Create Book".
- **`CharacterPanel.tsx`**: "Select a character"; "Untitled Character" (фолбэк имени и alt);
  "Name"; "Character name..."; "Photo URL"; "Character photo" (alt); "Description"; "Who is this
  character..."; "Notes"; "Additional notes...". (Уже по-русски — не трогать: "Удалить
  персонажа?", "Удалить персонажа", "Ссылка на изображение...".)
- **`Sidebar.tsx`**: "Book" (заголовок); "+ New Book"; "No books yet"; "Untitled Book"; "Chapters"
  (заголовок); "+ New Chapter"; "No chapters yet"; "+ New Scene"; "Characters" (заголовок);
  "+ New Character"; "No characters yet".
- **`Header.tsx`**: "Untitled Book" (статичный текст рядом с "Literary Studio" — само название
  продукта не трогать).
- **`DeveloperTools.tsx`**: "Developer Tools"; "Hide"/"Show".
- **`LineEditorPanel.tsx`**: "Paste a passage to line-edit..."; "Editing..."; "Line Edit";
  "Request failed." (фолбэк); "Error: " префикс.
- **`TestConnectionButton.tsx`**: "Testing..."; "Test Claude Connection"; "Request failed."
  (фолбэк).
- **`app/layout.tsx`**: `<html lang="en">` → `lang="ru"` — интерфейс теперь по умолчанию на
  русском (vision-документ раздел 6), значение атрибута было буквально неверным (влияет на
  доступность/screen-readers). `title`/`description` не трогать (см. исключения выше).

## Rules

- Только текстовые литералы — не менять структуру компонентов, className, логику.
- Единообразная терминология с уже существующим русским UI (например, "Спросить", "Фокус",
  "Удалить персонажа").

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npx prettier --check`, `npm run build` — чисто.
- Живая проверка: `npm run dev`/`next start`, обход основных экранов (обзор книги, глава, сцена,
  персонаж, диалог с ассистентом, панель Reader) — визуально не осталось английского текста вне
  списка сознательных исключений. Раз в этой среде нет браузерной автоматизации (постоянное
  ограничение) — проверка через прямое чтение отрендеренного HTML (`curl`) на предмет
  оставшихся английских строк из инвентаризации.

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
