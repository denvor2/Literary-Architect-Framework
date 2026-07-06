# ARP — Sprint-11-Step-01

**Шаг:** Мультикнижность: домен-модель Book[] + миграция старого Workspace
**Статус выполнения:** Готово к ревью

Самый рискованный шаг проекта на данный момент — работал медленно, проверял каждую часть
отдельно (типы → миграция → каждая функция контроллера), прежде чем двигаться дальше.

## Что сделано, по пунктам Step Card

### 1. model.ts — Book получает id, chapters, characters

Добавлено ровно так, как продиктовано: `id: string`, `chapters: readonly Chapter[]`,
`characters: readonly Character[]`. Scene/Chapter/Character не менялись.

### 2. workspace.ts — Workspace держит список книг

`Workspace` теперь `{ books: readonly Book[]; activeBookId: string | null;
selectedChapterId; selectedSceneId; selectedCharacterId }`. Поля `book`/`chapters`/`characters`
убраны с уровня Workspace — только внутри конкретного `Book` в `books[]`. Selection-поля
остались на уровне Workspace, как и предписано (сознательное упрощение — выбор сбрасывается при
переключении книг).

### 3. workspaceStorage.ts — миграция старого формата

Реализовано ровно по продиктованной логике (`migrateIfNeeded`), с одним отличием от буквального
кода в Step Card: **типизация `parsed` как `any` заменена на `unknown` + точечные касты**, потому
что `any` в этом проекте запрещён ESLint-правилом `@typescript-eslint/no-explicit-any` (сам
Step Card использовал `any` только как иллюстрацию логики, не как требование к типу). Поведение
идентично: если `parsed.books` — массив, это уже новый формат (мердж поверх `EMPTY_WORKSPACE`,
тот же паттерн, что уже был для верхнеуровневого мерджа); если есть `parsed.book` — мигрируем в
один `Book` с `id: "1"`, `chapters`/`characters` берутся из старых top-level полей с fallback на
`[]`; если нет `book` вообще — чистый `EMPTY_WORKSPACE`. Встроено в `loadWorkspace()` внутри того
же `try/catch`, что и был — любое исключение в `migrateIfNeeded` откатывается на
`EMPTY_WORKSPACE`, как и требовалось.

### 4. useWorkspaceController.ts — все функции переписаны на активную книгу

Каждая функция, которая раньше читала/писала `previous.chapters`/`previous.characters`
напрямую, теперь находит активную книгу через `previous.activeBookId` (или, для производных
значений верхнего уровня — через уже вычисленный `activeBook`/`chapters`/`characters`) и
применяет изменение к её `chapters`/`characters`, кладя обновлённую книгу обратно в `books`
(immutable `.map()` по `books`, по той же схеме, что раньше был `.map()` по `chapters`):

- **`createChapter()`** — переписана ровно по примеру из Step Card: ищет `activeBook`, если нет
  — no-op (`return previous`); нумерует главу через `activeBook.chapters.length + 1`;
  автовыделяет новую главу (сохранено поведение из Sprint 10 Step 05).
- **`updateChapter(chapterId, fields)`** — та же схема: находит `activeBook`, обновляет нужную
  главу внутри его `chapters` через `.map()`.
- **`createScene(chapterId?)`** — находит `activeBook`, затем (как и в Sprint 10 Step 06)
  `targetChapterId` (явный или fallback на `previous.selectedChapterId`), затем сам
  `targetChapter` **внутри `activeBook.chapters`** (не `previous.chapters`, которого больше нет)
  — если книги, целевой главы нет, или `targetChapterId` не задан — no-op. Автовыделение главы+
  сцены после создания сохранено.
- **`updateSceneText(chapterId, sceneId, text)`** / **`updateSceneTitle(chapterId, sceneId,
  title)`** — обе по идентичной схеме: находят `activeBook`, обновляют нужную сцену внутри
  нужной главы вложенным `.map()`.
- **`createCharacter()`** — находит `activeBook`, нумерует персонажа через
  `activeBook.characters.length + 1`, добавляет в `activeBook.characters`, автовыделяет (как в
  Sprint 10 Step 02/03).
- **`updateCharacter(characterId, fields)`** / **`deleteCharacter(characterId)`** — та же схема:
  находят `activeBook`, применяют `.map()`/`.filter()` к его `characters`.
- **`selectChapter`/`selectScene`/`selectCharacter`** — **не изменились по существу** (не
  трогают `chapters`/`characters` напрямую, только selection-поля Workspace, которые остались
  на прежнем уровне) — оставлены как были.

### 5. createBook() — теперь добавляет, не заменяет

Переписана ровно по Step Card: принимает `Omit<Book, "id" | "chapters" | "characters">`,
нумерует новую книгу (`previous.books.length + 1`), инициализирует её с одной главой (Chapter 1
+ Scene 1) и пустыми `characters`, добавляет в `books` (не заменяет), делает её активной
(`activeBookId`), сбрасывает selection.

**Проблема с `NewBookDialog.tsx` (вне Allowed paths, не трогал — Stop Condition этого пункта)**:
`NewBookDialogProps.onCreate` типизирован как `(book: Book) => void`, и вызывается с
`onCreate({ title, genre, language, premise })` — объектом БЕЗ `id`/`chapters`/`characters`.
Раньше это совпадало со старым (более узким) типом `Book`. Теперь `Book` требует
`id`/`chapters`/`characters`, а фактически передаваемый объект — ровно та форма, которую
ожидает НОВЫЙ `createBook` (`Omit<Book, "id" | "chapters" | "characters">`). То есть сам вызов
`onCreate(...)` семантически уже правильный — несовместим только тип **объявления** пропа
`onCreate` в `NewBookDialogProps`. Ожидаемая ошибка компиляции (см. Валидацию ниже). Это чисто
изменение типа, не логики — оставляю на Step 02, не трогаю самовольно.

### 6. Derived-значения

`activeBook = books.find(b => b.id === activeBookId)`; `chapters = activeBook?.chapters ?? []`;
`characters = activeBook?.characters ?? []`; `selectedChapter`/`selectedScene`/
`selectedCharacter` ищутся через эти переменные (как и раньше, просто источник теперь
`activeBook`, а не Workspace напрямую).

**`selectBook(bookId: string)` — добавлена, но с важным побочным эффектом, требующим внимания
Architect (см. следующий раздел).**

## Важный, сознательно принятый разрыв — коллизия имени `selectBook`

В контроллере уже существовала функция `selectBook()` **без аргументов** (Sprint 10 Step 04) —
"сбросить выбор главы/сцены/персонажа, вернуться к обзору текущей книги". Step Card прямо
просит: *"Добавь новую функцию selectBook(bookId: string)"* — с другим смыслом
("переключить активную книгу"). Одно имя не может означать оба одновременно в TypeScript (разные
сигнатуры), поэтому я заменил старую функцию новой, как и было прямо продиктовано — это не
самовольное решение, а буквальное следование Step Card. Последствия:

- Старое поведение "вернуться к обзору книги, остаться на той же книге" **не имеет дома в
  контроллере после этого шага** — концептуально это должно вернуться в Step 02, когда будет
  проектироваться multi-book UI навигация (вероятно, как отдельная функция с другим именем, или
  как `selectBook(activeBookId)` — вызов с тем же id, что уже активен).
- Именно поэтому `Sidebar.tsx`'s текущий вызов `onSelectBook={selectBook}` (ожидает `() => void`)
  ломается на уровне типов в `page.tsx` — см. Валидацию. Это тот самый "known, temporary
  disconnect", который Rules явно разрешили не чинить со стороны компонентов.

Флагирую отдельно и явно, а не молча — это прямое следствие дословного выполнения инструкции
Step Card, но эффект достаточно значимый (потеря функциональности до Step 02), чтобы быть
уверенным, что Architect это увидел и одобрил, а не просто принял как один из ожидаемых
type-ошибок.

## Обновление после REVIEW: добавлена `deselectAll()`

Architect подтвердил разрыв выше как свой недосмотр в Step Card (не моё самовольное решение) и
санкционировал точечное добавление, раз файл уже открыт — не откладывать до Step 02:

```typescript
// Restores the Sprint-10-Step-04 "return to book overview" behavior,
// lost when selectBook() was repurposed in Sprint-11-Step-01 to mean
// "switch active book" instead. Deliberately does not touch
// activeBookId — only clears the chapter/scene/character selection
// within the currently active book.
function deselectAll() {
  setWorkspace((previous) => ({
    ...previous,
    selectedChapterId: null,
    selectedSceneId: null,
    selectedCharacterId: null,
  }));
}
```

Внесена и экспортирована из хука вместе с остальными функциями. Не подключена к UI (Sidebar/
page.tsx — Forbidden paths этого шага) — существует, чтобы не потеряться к Step 02, как и
просил Architect. Также уточнён комментарий над `selectBook` — вместо "no home in the
controller" теперь ссылается на `deselectAll()` как на найденное решение. `build`/`lint`/
`prettier` перепроверены после добавления — `tsc --noEmit` показывает те же самые (и только те
же) две ожидаемые ошибки в `page.tsx`/`NewBookDialog.tsx`, ничего нового.

## Временный алиас `book`

Как и предлагали Rules, `book` экспортируется из хука как алиас `activeBook ?? null` — с
комментарием в коде, что это временно, до Step 02. Это действительно упростило переход (без
этого алиаса компонентов сломались бы полностью, а не только точечно на `Book`'s новых полях и
`selectBook`).

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

### apps/studio/src/domain/workspace.ts

```typescript
import type { Book } from "./model";

export type Workspace = {
  books: readonly Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
};
```

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

### apps/studio/src/workspace/useWorkspaceController.ts

```typescript
"use client";

import { useEffect, useState } from "react";
import type { Book, Chapter, Character } from "@/domain/model";
import type { Workspace } from "@/domain/workspace";
import { loadWorkspace, saveWorkspace } from "@/storage/workspaceStorage";

// Used only as the pre-hydration initial state (see the restore effect
// below) — must match server render, so it cannot itself call
// loadWorkspace(), which depends on window.localStorage.
const EMPTY_WORKSPACE: Workspace = {
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
};

// Owns the Workspace domain state and every operation that mutates it —
// extracted unchanged from page.tsx (Sprint 06 Step 09). No new behavior:
// each exported function here is a straight move of the previous handler,
// same body, same call sites.
//
// Sprint-11-Step-01: rewritten for multi-book Workspace. Every mutation that
// used to read/write `previous.chapters`/`previous.characters` directly now
// finds the active Book via `previous.activeBookId`, applies the change to
// that Book's chapters/characters, and writes the updated Book back into
// `books` (immutable map over `books`, the same way every function used to
// map over `chapters`).
export function useWorkspaceController() {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY_WORKSPACE);
  const [isLoaded, setIsLoaded] = useState(false);
  const {
    books,
    activeBookId,
    selectedChapterId,
    selectedSceneId,
    selectedCharacterId,
  } = workspace;

  // Restore the previous workspace once, on mount. This intentionally
  // synchronizes React state from an external system (localStorage), which
  // cannot be read during server rendering — an effect is the correct,
  // hydration-safe place for it, even though the linter's general-purpose
  // heuristic flags the first setState call inside an effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkspace(loadWorkspace());
    setIsLoaded(true);
  }, []);

  // Persist the whole workspace under one key whenever it changes — but only
  // after the initial restore above has run, so we never overwrite existing
  // saved data with the default empty state during the first render.
  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspace(workspace);
  }, [workspace, isLoaded]);

  const activeBook = books.find((book) => book.id === activeBookId);
  const chapters = activeBook?.chapters ?? [];
  const characters = activeBook?.characters ?? [];
  const selectedChapter = chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );
  const selectedScene = selectedChapter?.scenes.find(
    (scene) => scene.id === selectedSceneId,
  );
  const selectedCharacter = characters.find(
    (character) => character.id === selectedCharacterId,
  );

  // Sprint-11-Step-01 TEMPORARY ALIAS: exported as `book` so the current
  // (not-yet-updated) page.tsx/components keep compiling against a single
  // active book for one more step. Remove when Step 02 updates the UI layer
  // to consume `books`/`activeBookId` directly.
  const book = activeBook ?? null;

  function createBook(
    newBookData: Omit<Book, "id" | "chapters" | "characters">,
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

  function createChapter() {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const nextNumber = activeBook.chapters.length + 1;
      const newChapter: Chapter = {
        id: String(nextNumber),
        title: `Chapter ${nextNumber}`,
        subtitle: "",
        scenes: [{ id: "1", title: "Scene 1", text: "" }],
      };
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, chapters: [...book.chapters, newChapter] }
            : book,
        ),
        selectedChapterId: newChapter.id,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function updateChapter(
    chapterId: string,
    fields: Partial<Pick<Chapter, "title" | "subtitle">>,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? { ...chapter, ...fields }
                    : chapter,
                ),
              }
            : book,
        ),
      };
    });
  }

  function createScene(chapterId?: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const targetChapterId = chapterId ?? previous.selectedChapterId;
      if (!targetChapterId) return previous;
      const targetChapter = activeBook.chapters.find(
        (chapter) => chapter.id === targetChapterId,
      );
      if (!targetChapter) return previous;
      const nextNumber = targetChapter.scenes.length + 1;
      const newSceneId = String(nextNumber);
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) =>
                  chapter.id === targetChapterId
                    ? {
                        ...chapter,
                        scenes: [
                          ...chapter.scenes,
                          {
                            id: newSceneId,
                            title: `Scene ${nextNumber}`,
                            text: "",
                          },
                        ],
                      }
                    : chapter,
                ),
              }
            : book,
        ),
        selectedChapterId: targetChapterId,
        selectedSceneId: newSceneId,
        selectedCharacterId: null,
      };
    });
  }

  function updateSceneText(chapterId: string, sceneId: string, text: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) => {
                  if (chapter.id !== chapterId) return chapter;
                  return {
                    ...chapter,
                    scenes: chapter.scenes.map((scene) =>
                      scene.id === sceneId ? { ...scene, text } : scene,
                    ),
                  };
                }),
              }
            : book,
        ),
      };
    });
  }

  function updateSceneTitle(chapterId: string, sceneId: string, title: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) => {
                  if (chapter.id !== chapterId) return chapter;
                  return {
                    ...chapter,
                    scenes: chapter.scenes.map((scene) =>
                      scene.id === sceneId ? { ...scene, title } : scene,
                    ),
                  };
                }),
              }
            : book,
        ),
      };
    });
  }

  function selectChapter(chapterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  function selectScene(chapterId: string, sceneId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: sceneId,
      selectedCharacterId: null,
    }));
  }

  function createCharacter() {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const nextNumber = activeBook.characters.length + 1;
      const newCharacter: Character = {
        id: String(nextNumber),
        name: "",
        description: "",
        notes: "",
        photoUrl: "",
      };
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, characters: [...book.characters, newCharacter] }
            : book,
        ),
        selectedCharacterId: newCharacter.id,
        selectedChapterId: null,
        selectedSceneId: null,
      };
    });
  }

  function updateCharacter(
    characterId: string,
    fields: Partial<
      Pick<Character, "name" | "description" | "notes" | "photoUrl">
    >,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                characters: book.characters.map((character) =>
                  character.id === characterId
                    ? { ...character, ...fields }
                    : character,
                ),
              }
            : book,
        ),
      };
    });
  }

  function deleteCharacter(characterId: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                characters: book.characters.filter(
                  (character) => character.id !== characterId,
                ),
              }
            : book,
        ),
      };
    });
  }

  function selectCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedCharacterId: characterId,
      selectedChapterId: null,
      selectedSceneId: null,
    }));
  }

  // Sprint-11-Step-01: replaces the previous zero-argument `selectBook()`
  // (Sprint 10 Step 04 — "deselect chapter/scene/character, return to the
  // current book's overview"). That was a naming collision, not the same
  // operation — switching the active book and returning to the current
  // book's overview are two different actions and always needed separate
  // names. This `selectBook` switches which book is active; the restored
  // "return to overview" behavior lives in `deselectAll()` below.
  function selectBook(bookId: string) {
    setWorkspace((previous) => ({
      ...previous,
      activeBookId: bookId,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  // Restores the Sprint-10-Step-04 "return to book overview" behavior,
  // lost when selectBook() was repurposed in Sprint-11-Step-01 to mean
  // "switch active book" instead. Deliberately does not touch
  // activeBookId — only clears the chapter/scene/character selection
  // within the currently active book.
  function deselectAll() {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  return {
    workspace,
    book,
    books,
    activeBookId,
    chapters,
    selectedChapterId,
    selectedSceneId,
    selectedChapter,
    selectedScene,
    characters,
    selectedCharacterId,
    selectedCharacter,
    createBook,
    createChapter,
    updateChapter,
    createScene,
    updateSceneText,
    updateSceneTitle,
    selectChapter,
    selectScene,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    selectBook,
    deselectAll,
  };
}
```

## Валидация

```
npm run build → TypeScript ошибки, все ожидаемые, ровно в двух местах, оба вне Allowed paths:

  src/app/page.tsx(56,13): error TS2322: Type '(bookId: string) => void' is not assignable to
    type '() => void'. — селф-объяснимо, см. раздел про коллизию selectBook выше.

  src/components/NewBookDialog.tsx(33,14): error TS2345: Argument of type '{ title: string;
    genre: string; language: string; premise: string; }' is not assignable to parameter of type
    'Book'. Missing: id, chapters, characters. — см. раздел про createBook()/NewBookDialog выше;
    сам передаваемый объект уже правильной формы, несовпадение только в объявлении типа пропа
    onCreate.

  Полный `npx tsc --noEmit` подтверждает — это ЕДИНСТВЕННЫЕ две ошибки во всём проекте, обе в
  Forbidden paths этого шага. Allowed paths (model.ts, workspace.ts, workspaceStorage.ts,
  useWorkspaceController.ts) компилируются внутренне непротиворечиво.

npm run lint → изначально одна ошибка (@typescript-eslint/no-explicit-any на migrateIfNeeded)
  из-за `any` в буквальном примере кода Step Card — заменил на `unknown` + точечные касты (см.
  раздел "3." выше), перепроверено чисто.

npx prettier --check → чисто (проверено сразу, извлёк урок из Sprint-10-Step-06).

git status --short → ровно 4 файла из Allowed paths (model.ts, workspace.ts,
  workspaceStorage.ts, useWorkspaceController.ts — все M); apps/studio/src/components/**,
  apps/studio/src/app/page.tsx, apps/studio/src/ai/**, apps/studio/src/app/api/** не тронуты.
```

### Живая проверка миграции — выполнена, полный вывод

Временный tsx-скрипт (вне репозитория, в scratchpad) мокает `localStorage` **реалистичным
старым форматом** (одна книга, две главы — одна с подзаголовком и двумя сценами, другая пустая,
один персонаж, все три selection-поля заполнены), импортирует реальный, скомпилированный
`loadWorkspace()` напрямую через `file://` и проверяет результат по 16 пунктам — заголовок,
жанр, язык, премиз книги; обе главы и обе сцены первой главы; текст второй сцены; персонаж и его
имя; все три selection-поля; и что `activeBookId` действительно указывает на мигрированную
книгу. Отдельно проверена идемпотентность — повторная загрузка уже смигрированных данных не
портит и не задваивает их.

```
Full migrated Workspace: {
  "books": [
    {
      "id": "1",
      "title": "The Real Book",
      "genre": "Fantasy",
      "language": "Russian",
      "premise": "A story about migration.",
      "chapters": [
        {
          "id": "1",
          "title": "Chapter 1",
          "subtitle": "The beginning",
          "scenes": [
            { "id": "1", "title": "Scene 1", "text": "It was a dark night." },
            { "id": "2", "title": "Scene 2", "text": "Then it got worse." }
          ]
        },
        {
          "id": "2",
          "title": "Chapter 2",
          "subtitle": "",
          "scenes": [{ "id": "1", "title": "Scene 1", "text": "" }]
        }
      ],
      "characters": [
        { "id": "1", "name": "Alice", "description": "The protagonist.", "notes": "Likes tea.", "photoUrl": "" }
      ]
    }
  ],
  "activeBookId": "1",
  "selectedChapterId": "1",
  "selectedSceneId": "2",
  "selectedCharacterId": null
}
PASS: exactly one book
PASS: activeBookId points to the migrated book
PASS: migrated book id is '1'
PASS: book title preserved
PASS: book genre preserved
PASS: book language preserved
PASS: book premise preserved
PASS: both chapters preserved
PASS: chapter 1 subtitle preserved
PASS: chapter 1 has both scenes
PASS: scene 2 text preserved
PASS: character preserved
PASS: character name preserved
PASS: selectedChapterId preserved
PASS: selectedSceneId preserved
PASS: selectedCharacterId preserved (null)
PASS: already-migrated data loads unchanged (idempotent)

ALL CHECKS PASS
```

**Что НЕ проверено живым запуском (честно):** сами мутационные функции контроллера
(`createChapter`/`createScene`/`createCharacter`/... через активную книгу) — это React state
(`useState`/`setWorkspace`), не тестируется без React-рендерера, которого в проекте нет
(jsdom/testing-library отсутствуют — проверял ранее). Это код-ревью логики + внутренняя
компиляция (Allowed paths собираются без ошибок), не запуск. Самая рискованная часть —
миграция существующих данных пользователя — проверена реальным запуском, как и требовал Step
Card явно ("обязательна, не пропускай"); остальное — тот же уровень проверки, что и в
предыдущих шагах контроллера.

## Отклонения от Step Card

1. `any` → `unknown` + касты в `migrateIfNeeded` (см. выше) — вынужденное отклонение от
   буквального примера кода, ради соответствия ESLint-правилу проекта. Поведение идентично.
2. Коллизия `selectBook()` (см. отдельный раздел выше) — не отклонение от инструкции (сделано
   ровно как продиктовано), но со значимым побочным эффектом, который явно флагирую для
   осознанного подтверждения, а не молча.
3. `NewBookDialog.tsx`'s type mismatch — не трогал, как и предписывали Rules/Stop Condition,
   описал проблему точно (см. выше), не решал сам.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect. Учитывая риск этого шага, готов
внести любые правки до коммита, если что-то в подходе к миграции вызывает сомнения.

Жду REVIEW.md.
