# ARP — Sprint-11-Step-03

**Шаг:** Редактируемые данные книги в обзоре (title/genre/language/premise)
**Статус выполнения:** Готово к ревью

## Что сделано

### 1. useWorkspaceController.ts — updateBook

Добавлена `updateBook(bookId, fields)` ровно по коду из Step Card — `Partial<Pick<Book, "title"
| "genre" | "language" | "premise">>`, immutable `.map()` по `books`. Экспортирована из хука
вместе с остальными.

### 2. EditorArea.tsx — обзор книги стал редактируемым

Финальная ветка (ни chapter, ни scene не выбраны) переписана: статичные `<h1>`/`<p>` заменены на
поля ввода:
- **Title** — `input`, крупный шрифт (`text-2xl font-semibold`, как и был заголовок), placeholder
  "Book title...".
- **Genre**/**Language** — два отдельных `input` в одной строке (`flex gap-2`) вместо прежнего
  объединённого текста "{genre} · {language}".
- **Premise** — `textarea` (не `input` — может быть длинным текстом), **всегда видима** (убрано
  условие `{book.premise && ...}` — раз это теперь редактируемое поле, оно должно быть видно и
  пустым), placeholder "What is this book about?".

Все три — `onChange` → `onUpdateBook(book.id, { <field>: value })`. Список Chapters ниже не
менялся. Добавлен новый проп `onUpdateBook` в `EditorAreaProps`.

### 3. page.tsx — проброс

`updateBook` из контроллера передан в `EditorArea` как `onUpdateBook`.

## Изменённые файлы целиком

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

  function updateBook(
    bookId: string,
    fields: Partial<Pick<Book, "title" | "genre" | "language" | "premise">>,
  ) {
    setWorkspace((previous) => ({
      ...previous,
      books: previous.books.map((book) =>
        book.id === bookId ? { ...book, ...fields } : book,
      ),
    }));
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
    activeBook,
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
    updateBook,
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

### apps/studio/src/app/page.tsx

```tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { EditorArea } from "@/components/EditorArea";
import { CharacterPanel } from "@/components/CharacterPanel";
import { AssistantPanel } from "@/components/AssistantPanel";
import { DeveloperTools } from "@/components/DeveloperTools";
import { NewBookDialog } from "@/components/NewBookDialog";
import { useWorkspaceController } from "@/workspace/useWorkspaceController";

export default function Home() {
  const {
    activeBook,
    books,
    activeBookId,
    chapters,
    selectedChapterId,
    selectedSceneId,
    createBook,
    updateBook,
    createChapter,
    updateChapter,
    createScene,
    updateSceneText,
    updateSceneTitle,
    selectChapter,
    selectScene,
    characters,
    selectedCharacterId,
    selectedCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    selectBook,
    deselectAll,
  } = useWorkspaceController();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Ephemeral UI state only — not part of Workspace, not persisted.
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Clicking the already-active book returns to its overview (Sprint 10
  // behavior); clicking a different book switches to it.
  function handleSelectBook(bookId: string) {
    if (bookId === activeBookId) {
      deselectAll();
    } else {
      selectBook(bookId);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white font-sans dark:bg-black">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!isFocusMode && (
          <Sidebar
            books={books}
            activeBookId={activeBookId}
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            selectedSceneId={selectedSceneId}
            onSelectChapter={selectChapter}
            onSelectScene={selectScene}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={selectCharacter}
            onCreateCharacter={createCharacter}
            onSelectBook={handleSelectBook}
            onNewBook={() => setIsDialogOpen(true)}
            onCreateChapter={createChapter}
            onCreateScene={createScene}
          />
        )}
        {selectedCharacterId ? (
          <CharacterPanel
            character={selectedCharacter}
            onUpdate={(fields) => updateCharacter(selectedCharacterId, fields)}
            onDelete={() => deleteCharacter(selectedCharacterId)}
          />
        ) : (
          <EditorArea
            book={activeBook}
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            selectedSceneId={selectedSceneId}
            onNewScene={createScene}
            onChangeSceneText={updateSceneText}
            onUpdateChapter={updateChapter}
            onUpdateSceneTitle={updateSceneTitle}
            onUpdateBook={updateBook}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((value) => !value)}
          />
        )}
        {!isFocusMode && <AssistantPanel />}
      </div>
      {!isFocusMode && <DeveloperTools />}

      {isDialogOpen && (
        <NewBookDialog
          onCancel={() => setIsDialogOpen(false)}
          onCreate={(newBook) => {
            createBook(newBook);
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
```

### apps/studio/src/components/EditorArea.tsx (только изменённые фрагменты — файл 760+ строк, остальное не менялось)

```tsx
type EditorAreaProps = {
  book?: Book | null;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onNewScene?: () => void;
  onChangeSceneText?: (
    chapterId: string,
    sceneId: string,
    text: string,
  ) => void;
  onUpdateChapter?: (
    chapterId: string,
    fields: Partial<Pick<Chapter, "title" | "subtitle">>,
  ) => void;
  onUpdateSceneTitle?: (
    chapterId: string,
    sceneId: string,
    title: string,
  ) => void;
  onUpdateBook?: (
    bookId: string,
    fields: Partial<Pick<Book, "title" | "genre" | "language" | "premise">>,
  ) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
};

export function EditorArea({
  book,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onNewScene,
  onChangeSceneText,
  onUpdateChapter,
  onUpdateSceneTitle,
  onUpdateBook,
  isFocusMode = false,
  onToggleFocusMode,
}: EditorAreaProps) {
  // ... (unchanged: textareaRef, !book branch, selectedChapter/selectedScene
  //      branches, selectedChapter-only branch)

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <input
          value={book.title}
          onChange={(event) =>
            onUpdateBook?.(book.id, { title: event.target.value })
          }
          placeholder="Book title..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-2xl font-semibold tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <div className="flex gap-2">
          <input
            value={book.genre}
            onChange={(event) =>
              onUpdateBook?.(book.id, { genre: event.target.value })
            }
            placeholder="Genre..."
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
          <input
            value={book.language}
            onChange={(event) =>
              onUpdateBook?.(book.id, { language: event.target.value })
            }
            placeholder="Language..."
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
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
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Chapters
        </h2>
        {/* ... (unchanged: chapters list) */}
      </div>
    </main>
  );
}
```

## Валидация

```
npx tsc --noEmit → 0 ошибок во всём проекте
npm run build → успешно (Compiled successfully)
npm run lint  → чисто
npx prettier --check → чисто
git status --short → ровно 3 файла из Allowed paths (useWorkspaceController.ts, EditorArea.tsx,
                       page.tsx — все M); Sidebar.tsx/CharacterPanel.tsx/NewBookDialog.tsx/
                       domain/**/storage/**/ai/**/api/** не тронуты
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Код-ревью: `updateBook` — точная копия паттерна `updateCharacter`/`updateChapter` (найти
активную книгу... точнее, здесь ищем по явному `bookId`, не через `activeBookId` — что
корректно, поскольку обзор книги показывается только для активной книги, но сигнатура,
продиктованная Step Card, принимает `bookId` явно, для общности). Прошу лично проверить: выбрать
книгу (обзор без выбранной главы), изменить title/genre/language/premise — сохраняется, title
виден в Sidebar после изменения, переживает перезагрузку страницы.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
