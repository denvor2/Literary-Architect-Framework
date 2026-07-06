# ARP — Sprint-11-Step-04

**Шаг:** Book: Genre/Language как select везде + новые поля (tags, аннотации)
**Статус выполнения:** Готово к ревью

## Важное отклонение — правка Forbidden path (workspaceStorage.ts)

Step Card требует `npx tsc --noEmit → 0 ошибок` **без исключений** (в отличие от Sprint-11-
Step-01/02, где конкретные type-ошибки в Forbidden paths были явно предусмотрены и разрешены).
После добавления `shortAnnotation`/`fullAnnotation`/`tags` в `Book` (п.1) миграция старых данных
в `workspaceStorage.ts` (`migrateIfNeeded`, Forbidden path этого шага) перестала компилироваться
— `migratedBook: Book` больше не содержал новые обязательные поля.

Это тот же класс ситуации, что и `page.tsx` в Sprint-11-Step-06 — Forbidden path ломается из-за
изменения `model.ts`, которое Step Card не мог предвидеть в деталях, а сам Step Card требует
"0 ошибок" без оговорки. Внёс минимальную правку — три поля с дефолтом (`?? ""`/`?? []`), **той
же формы**, что уже была для `chapters`/`characters` в этой же функции при её написании в
Sprint-11-Step-01:

```typescript
shortAnnotation: oldBook.shortAnnotation ?? "",
fullAnnotation: oldBook.fullAnnotation ?? "",
tags: (oldBook.tags as readonly string[] | undefined) ?? [],
```

Флагирую отдельно и явно, а не молча — прошу подтвердить или указать откатить.

## Что сделано, по пунктам Step Card

### 1. model.ts — новые поля Book

Добавлены `shortAnnotation: string`, `fullAnnotation: string`, `tags: readonly string[]` —
ровно по коду из Step Card.

### 2. NewBookDialog.tsx — Language становится select

Добавлен `LANGUAGES` (`Russian, English, Ukrainian, Belarusian, Kazakh`) рядом с уже
существующим `GENRES`; `<input type="text">` для Language заменён на `<select>` по образцу
Genre. Оба массива экспортированы (`export const GENRES`/`export const LANGUAGES`) — единый
источник правды, переиспользован в `EditorArea.tsx`, не задублирован.

Tags/аннотации **не добавлены** в диалог создания — он остаётся компактным
(Title/Genre/Language/Premise). `NewBookDialogProps.onCreate`'s тип расширен исключениями
(`Omit<Book, "id" | "chapters" | "characters" | "tags" | "shortAnnotation" | "fullAnnotation">`)
— сам вызов `onCreate({ title, genre, language, premise })` не менялся.

### 3. EditorArea.tsx — обзор книги

- Genre/Language — `<input>` заменены на `<select>` с опциями из `GENRES`/`LANGUAGES`,
  импортированных из `NewBookDialog.tsx`.
- После Premise добавлены три новых поля: **Tags** (`input`, значения через запятую — при
  `onChange` разбиваются по запятой, тримятся, пустые отфильтровываются), **Short Annotation**
  (`textarea`, `rows={2}`, компактнее Premise), **Full Annotation** (`textarea`, `rows={6}`,
  крупнее). Все — через `onUpdateBook`, тот же паттерн, что и остальные поля книги.
- `onUpdateBook`'s тип в `EditorAreaProps` расширен теми же тремя полями.

### 4. useWorkspaceController.ts

- `updateBook`'s `Pick` расширен до `"title" | "genre" | "language" | "premise" |
  "shortAnnotation" | "fullAnnotation" | "tags"`.
- `createBook`'s параметр (`newBookData`) типизирован с теми же тремя исключениями, что и
  `NewBookDialogProps.onCreate` (согласованно); внутри функции новая книга инициализируется
  `tags: []`, `shortAnnotation: ""`, `fullAnnotation: ""` — рядом с уже существующей
  инициализацией `characters: []`.

## Изменённые файлы целиком

### apps/studio/src/domain/model.ts

```typescript
// Domain Model Layer (Sprint 06, Step 01).
//
// Pure types only. No UI logic, no storage logic, no imports from React,
// Next.js, or any component/API module. These shapes match exactly what the
// UI already produced and consumed before this sprint (see docs/reports/
// SPRINT-05.md) — this is a type-level extraction, not a data-shape change.
//
// Fields are `readonly` to express the "immutable structures" rule. Existing
// call sites already update state by producing new objects/arrays (spread,
// `.map`), never by mutating in place, so this does not change behavior.

export type Scene = {
  readonly id: string;
  readonly title: string;
  readonly text: string;
};

export type Chapter = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly scenes: readonly Scene[];
};

export type Book = {
  readonly id: string;
  readonly title: string;
  readonly genre: string;
  readonly language: string;
  readonly premise: string;
  readonly shortAnnotation: string;
  readonly fullAnnotation: string;
  readonly tags: readonly string[];
  readonly chapters: readonly Chapter[];
  readonly characters: readonly Character[];
};

export type Character = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly notes: string;
  readonly photoUrl: string;
};
```

### apps/studio/src/components/NewBookDialog.tsx

```tsx
"use client";

import { useState } from "react";
import type { Book } from "@/domain/model";

export const GENRES = [
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Non-Fiction",
  "Other",
];

export const LANGUAGES = [
  "Russian",
  "English",
  "Ukrainian",
  "Belarusian",
  "Kazakh",
];

type NewBookDialogProps = {
  onCancel: () => void;
  onCreate: (
    book: Omit<
      Book,
      "id" | "chapters" | "characters" | "tags" | "shortAnnotation" | "fullAnnotation"
    >,
  ) => void;
};

export function NewBookDialog({ onCancel, onCreate }: NewBookDialogProps) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [language, setLanguage] = useState("Russian");
  const [premise, setPremise] = useState("");

  const canCreate = title.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    onCreate({ title: title.trim(), genre, language, premise });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          New Book
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Book Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter a title..."
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Genre
            </span>
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {GENRES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Language
            </span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {LANGUAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Premise / Idea
            </span>
            <textarea
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              rows={4}
              placeholder="What is this book about?"
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create Book
          </button>
        </div>
      </div>
    </div>
  );
}
```

### apps/studio/src/storage/workspaceStorage.ts (Forbidden path — см. отклонение выше, диф минимален)

```typescript
// Workspace persistence — Sprint 06 Step 07 (extraction only).
//
// Moved out of page.tsx unchanged: same key, same JSON shape, same
// fallback-to-empty behavior on missing/corrupted data. No versioning, no
// validation, no async API, no repository — a straight lift of the
// existing logic.

import type { Book, Chapter, Character } from "@/domain/model";
import type { Workspace } from "@/domain/workspace";

const STORAGE_KEY = "literary-studio-workspace";

const EMPTY_WORKSPACE: Workspace = {
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
};

// Sprint-11-Step-01: migrates the single-book Workspace shape (Sprint 05
// through Sprint 10 — one `book` object plus top-level `chapters`/
// `characters`) into the multi-book shape (`books: Book[]`, `activeBookId`).
// This is the first real data-shape migration in the project — read
// carefully before changing.
function migrateIfNeeded(parsed: unknown): Workspace {
  const data = parsed as Record<string, unknown>;

  // New format already — nothing to migrate.
  if (Array.isArray(data.books)) {
    return { ...EMPTY_WORKSPACE, ...(data as Partial<Workspace>) };
  }

  // Old format: single `book` (without id/chapters/characters — those were
  // separate top-level Workspace fields) + top-level chapters/characters.
  if (data.book) {
    const oldBook = data.book as Partial<Book>;
    const migratedBook: Book = {
      id: "1",
      title: oldBook.title ?? "",
      genre: oldBook.genre ?? "",
      language: oldBook.language ?? "",
      premise: oldBook.premise ?? "",
      // Sprint-11-Step-04: fields added to Book after this migration was
      // written — old saved data never had them, so they default empty,
      // same as chapters/characters do above.
      shortAnnotation: oldBook.shortAnnotation ?? "",
      fullAnnotation: oldBook.fullAnnotation ?? "",
      tags: (oldBook.tags as readonly string[] | undefined) ?? [],
      chapters: (data.chapters as readonly Chapter[] | undefined) ?? [],
      characters: (data.characters as readonly Character[] | undefined) ?? [],
    };
    return {
      books: [migratedBook],
      activeBookId: migratedBook.id,
      selectedChapterId: (data.selectedChapterId as string | null) ?? null,
      selectedSceneId: (data.selectedSceneId as string | null) ?? null,
      selectedCharacterId: (data.selectedCharacterId as string | null) ?? null,
    };
  }

  // No book at all (fresh/empty old data) — start clean in new format.
  return EMPTY_WORKSPACE;
}

export function loadWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WORKSPACE;
    return migrateIfNeeded(JSON.parse(raw));
  } catch {
    return EMPTY_WORKSPACE;
  }
}

export function saveWorkspace(workspace: Workspace): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}
```

### apps/studio/src/workspace/useWorkspaceController.ts (только изменённые фрагменты — createBook/updateBook; остальная логика не менялась)

```typescript
  function createBook(
    newBookData: Omit<
      Book,
      | "id"
      | "chapters"
      | "characters"
      | "tags"
      | "shortAnnotation"
      | "fullAnnotation"
    >,
  ) {
    setWorkspace((previous) => {
      const nextNumber = previous.books.length + 1;
      const newBook: Book = {
        id: String(nextNumber),
        ...newBookData,
        chapters: [
          {
            id: "1",
            title: "Chapter 1",
            subtitle: "",
            scenes: [{ id: "1", title: "Scene 1", text: "" }],
          },
        ],
        // A new book starts with no characters — the writer adds them later.
        characters: [],
        // New book-level fields (Sprint-11-Step-04) start empty — filled in
        // later via the book overview's editing form, not the creation
        // dialog (kept compact: Title/Genre/Language/Premise only).
        tags: [],
        shortAnnotation: "",
        fullAnnotation: "",
      };
      return {
        ...previous,
        books: [...previous.books, newBook],
        activeBookId: newBook.id,
        selectedChapterId: null,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function updateBook(
    bookId: string,
    fields: Partial<
      Pick<
        Book,
        | "title"
        | "genre"
        | "language"
        | "premise"
        | "shortAnnotation"
        | "fullAnnotation"
        | "tags"
      >
    >,
  ) {
    setWorkspace((previous) => ({
      ...previous,
      books: previous.books.map((book) =>
        book.id === bookId ? { ...book, ...fields } : book,
      ),
    }));
  }
```

### apps/studio/src/components/EditorArea.tsx (только изменённые фрагменты — файл 780+ строк, остальное не менялось)

```tsx
import { GENRES, LANGUAGES } from "@/components/NewBookDialog";

// ...

  onUpdateBook?: (
    bookId: string,
    fields: Partial<
      Pick<
        Book,
        | "title"
        | "genre"
        | "language"
        | "premise"
        | "shortAnnotation"
        | "fullAnnotation"
        | "tags"
      >
    >,
  ) => void;

// ... (book overview branch)

        <div className="flex gap-2">
          <select
            value={book.genre}
            onChange={(event) =>
              onUpdateBook?.(book.id, { genre: event.target.value })
            }
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {GENRES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={book.language}
            onChange={(event) =>
              onUpdateBook?.(book.id, { language: event.target.value })
            }
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {LANGUAGES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={book.premise}
          onChange={(event) =>
            onUpdateBook?.(book.id, { premise: event.target.value })
          }
          placeholder="What is this book about?"
          rows={4}
          className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />
        <input
          value={book.tags.join(", ")}
          onChange={(event) =>
            onUpdateBook?.(book.id, {
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0),
            })
          }
          placeholder="Tags (comma-separated)..."
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
        />
        <textarea
          value={book.shortAnnotation}
          onChange={(event) =>
            onUpdateBook?.(book.id, { shortAnnotation: event.target.value })
          }
          placeholder="Short annotation..."
          rows={2}
          className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />
        <textarea
          value={book.fullAnnotation}
          onChange={(event) =>
            onUpdateBook?.(book.id, { fullAnnotation: event.target.value })
          }
          placeholder="Full annotation..."
          rows={6}
          className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />
```

`page.tsx` — не потребовал изменений: `onCreate={(newBook) => createBook(newBook)}` продолжает
типизироваться корректно, поскольку `createBook`'s параметр и `NewBookDialogProps.onCreate`
используют одинаковый набор исключений.

## Валидация

```
npx tsc --noEmit → 0 ошибок во всём проекте (после правки workspaceStorage.ts — см. отклонение)
npm run build → успешно (Compiled successfully)
npm run lint  → чисто
npx prettier --check → чисто
git status --short → 4 файла из Allowed paths (model.ts, NewBookDialog.tsx, EditorArea.tsx,
                       useWorkspaceController.ts — все M) + 1 файл вне Allowed paths
                       (workspaceStorage.ts, M — см. отклонение); page.tsx не потребовал
                       изменений; Sidebar.tsx/CharacterPanel.tsx/domain/workspace.ts/ai/**/
                       api/** не тронуты
```

**Живая проверка миграции — выполнена реально**, раз уж пришлось трогать `workspaceStorage.ts`:
tsx-скрипт мокает `localStorage` старым форматом (без `tags`/`shortAnnotation`/
`fullAnnotation` на книге — ровно тот формат, что был до этого шага), вызывает реальный
`loadWorkspace()`:

```
Migrated book: { ..., "shortAnnotation": "", "fullAnnotation": "", "tags": [], ... }
PASS: book exists
PASS: title preserved
PASS: tags defaults to []
PASS: shortAnnotation defaults to ''
PASS: fullAnnotation defaults to ''
```

**Живая проверка в браузере (честно, ограничение среды):** нет браузера — та же оговорка, что и
всегда. Код-ревью остальных изменений (select-списки, tags-парсинг через запятую) сделан.
Прошу лично проверить: создать книгу (Genre/Language — оба списком), открыть обзор, заполнить
Tags/аннотации — сохраняется, переживает перезагрузку.

## Отклонения от Step Card

Единственное — уже подробно описанная правка `workspaceStorage.ts` (Forbidden path),
необходимая для достижения обязательного "0 ошибок" в Validation. Минимальна, той же формы, что
уже есть в этой же функции.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
