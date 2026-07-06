# ARP — Fix-Book-Fields-Undefined-Systemic

**Задача:** СРОЧНО — normalizeBook: системный фикс для tags/shortAnnotation/fullAnnotation на
старых книгах, плюс системная защита от повторения этого класса бага
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/storage/workspaceStorage.ts` добавлена `normalizeBook(book: Partial<Book>):
Book` — ровно по коду из Step Card, дефолт на каждое поле `Book`. Применена в обеих ветках
`migrateIfNeeded`:

1. **Ветка "уже новый формат"** (`Array.isArray(data.books)`) — вместо простого мерджа `data`
   как есть, каждая книга массива теперь проходит через `.map(normalizeBook)`. Это устраняет
   именно тот краш, что произошёл: книги, сохранённые в формате `books[]` (уже после Sprint-11-
   Step-01), но ДО Sprint-11-Step-04 (когда `tags`/`shortAnnotation`/`fullAnnotation` ещё не
   существовали у `Book`), теперь получают дефолты вместо `undefined`.
2. **Ветка миграции старого single-book формата** — ручная конструкция `migratedBook: Book` с
   дублированием дефолтов (`?? ""`, `?? []`) заменена на вызов `normalizeBook({...})` с теми же
   исходными значениями — тот же результат, но дефолты живут в одном месте, не в двух.

Централизация: если в будущем добавится ещё одно поле `Book`, и `normalizeBook` не обновят,
дефект проявится сразу и однотипно (undefined-значение поля сразу после загрузки), а не как
труднообъяснимый краш в случайном компоненте месяцы спустя — именно та системная защита, которую
просил Step Card, а не ещё одна точечная правка (это уже третий случай одного и того же класса
проблемы: `characters` на Workspace, `Chapter.subtitle`, теперь поля `Book`).

Компоненты не тронуты — они не должны сами защищаться от `undefined` для полей `Book`, раз есть
`normalizeBook` на входе, как и требовали Rules.

## Изменённый файл целиком

### apps/studio/src/storage/workspaceStorage.ts

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

// Fix-Book-Fields-Undefined-Systemic: centralizes "what to do about a
// missing Book field" in one place. Every field of Book gets a default
// here — if a future field is added to Book and this function isn't
// updated, the defect shows up immediately and uniformly (a missing field
// here), not as a hard-to-explain crash in some random component months
// later. Third occurrence of this exact class of bug (Workspace-level
// characters, Chapter.subtitle, now Book fields) — this is why it's a
// shared function instead of another one-off fix at the point of use.
function normalizeBook(book: Partial<Book>): Book {
  return {
    id: book.id ?? "",
    title: book.title ?? "",
    genre: book.genre ?? "",
    language: book.language ?? "",
    premise: book.premise ?? "",
    shortAnnotation: book.shortAnnotation ?? "",
    fullAnnotation: book.fullAnnotation ?? "",
    tags: book.tags ?? [],
    chapters: book.chapters ?? [],
    characters: book.characters ?? [],
  };
}

// Sprint-11-Step-01: migrates the single-book Workspace shape (Sprint 05
// through Sprint 10 — one `book` object plus top-level `chapters`/
// `characters`) into the multi-book shape (`books: Book[]`, `activeBookId`).
// This is the first real data-shape migration in the project — read
// carefully before changing.
function migrateIfNeeded(parsed: unknown): Workspace {
  const data = parsed as Record<string, unknown>;

  // New format already — nothing to migrate, but each book still passes
  // through normalizeBook() in case it's missing fields added to Book
  // after it was saved (see Fix-Book-Fields-Undefined-Systemic above).
  if (Array.isArray(data.books)) {
    return {
      ...EMPTY_WORKSPACE,
      ...(data as Partial<Workspace>),
      books: data.books.map((book) => normalizeBook(book as Partial<Book>)),
    };
  }

  // Old format: single `book` (without id/chapters/characters — those were
  // separate top-level Workspace fields) + top-level chapters/characters.
  if (data.book) {
    const oldBook = data.book as Partial<Book>;
    const migratedBook = normalizeBook({
      id: "1",
      title: oldBook.title,
      genre: oldBook.genre,
      language: oldBook.language,
      premise: oldBook.premise,
      shortAnnotation: oldBook.shortAnnotation,
      fullAnnotation: oldBook.fullAnnotation,
      tags: oldBook.tags,
      chapters: data.chapters as readonly Chapter[] | undefined,
      characters: data.characters as readonly Character[] | undefined,
    });
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

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
npx prettier --check → чисто
npx tsc --noEmit → 0 ошибок
git status --short → ровно 1 файл (workspaceStorage.ts, M) — единственный Allowed path
```

**Живая проверка — выполнена по-настоящему, оба сценария, явно требуемых Step Card:**

**Сценарий 1 (сам краш):** `localStorage` замокан книгой в формате `books[]` (уже после
Sprint-11-Step-01) БЕЗ полей `tags`/`shortAnnotation`/`fullAnnotation` (сохранена до Sprint-11-
Step-04) — ровно та ситуация со скриншота. Вызов реального, скомпилированного `loadWorkspace()`
через `file://`:

```
Scenario 1 book: { ..., "shortAnnotation": "", "fullAnnotation": "", "tags": [], "chapters": [...] (1 глава сохранена), "characters": [] }
PASS: book exists
PASS: title preserved
PASS: tags defaults to []
PASS: shortAnnotation defaults to ''
PASS: fullAnnotation defaults to ''
PASS: chapters preserved (not wiped by normalize)
PASS: book.tags.join(...) does not throw   ← сам краш из скриншота, воспроизведён и подтверждён устранённым
```

**Сценарий 2 (регрессия на уже пройденный тест Sprint-11-Step-01):** старый single-book формат
(та же тестовая нагрузка, что использовалась при живой проверке Sprint-11-Step-01 — книга с
двумя главами, двумя сценами в первой главе, одним персонажем, все три selection-поля):

```
Scenario 2 book: { ..., оба главы, обе сцены первой главы, персонаж — всё сохранено, "tags": [] }
PASS: exactly one book
PASS: activeBookId points to migrated book
PASS: title preserved
PASS: both chapters preserved
PASS: chapter 1 has both scenes
PASS: character preserved
PASS: tags defaults to []
PASS: selectedChapterId preserved
PASS: selectedSceneId preserved

ALL CHECKS PASS
```

Оба сценария — реальный вызов реальной, скомпилированной функции с реальными данными, не
предположение.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect. Понимаю срочность, готов закоммитить
сразу по получении OK.

Жду REVIEW.md.
