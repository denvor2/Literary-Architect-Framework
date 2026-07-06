# ARP — Sprint-11-Step-02

**Шаг:** Мультикнижность: UI списка книг + устранение временного алиаса book
**Статус выполнения:** Готово к ревью

## Что сделано, по пунктам Step Card

### 1. NewBookDialog.tsx

`onCreate` перетипизирован с `(book: Book) => void` на `(book: Omit<Book, "id" | "chapters" |
"characters">) => void` — ровно как предписано. Сам вызов `onCreate({ title, genre, language,
premise })` не менялся — он уже был правильной формы (см. ARP Sprint-11-Step-01).

### 2. Sidebar.tsx — список книг

Единственный блок "Book" заменён на список по образцу Chapters/Characters: заголовок секции +
"+ New Book" в одной строке (без изменений), затем список книг (`books.map`), каждая — кнопка
`onClick={() => onSelectBook?.(book.id)}`, подсветка активной — `book.id === activeBookId`, тот
же класс-паттерн, что везде (`bg-zinc-200`/`dark:bg-zinc-800`). Пустое состояние "No books yet"
по аналогии с "No chapters yet"/"No characters yet". `SidebarProps`: `bookTitle` убран, добавлены
`books?: readonly Book[]` и `activeBookId?: string | null`; `onSelectBook` теперь принимает
`bookId: string`. Убрана более не нужная локальная переменная `isBookSelected` (использовалась
только старой одиночной кнопкой).

### 3. page.tsx — клик по активной книге = возврат к обзору

Добавлена `handleSelectBook(bookId)` ровно по коду из Step Card: если `bookId === activeBookId`
→ `deselectAll()`; иначе → `selectBook(bookId)`. Передана в `Sidebar` как `onSelectBook`.
`books`/`activeBookId` пробрасываются в `Sidebar` вместо прежнего `bookTitle`.
`<EditorArea book={...}>` теперь получает `activeBook` (переименован из временного алиаса `book`
— см. п.4) вместо прежнего `book`. `CharacterPanel`/остальная разводка не менялись.

### 4. useWorkspaceController.ts — устранён временный алиас

Убран блок:
```typescript
// Sprint-11-Step-01 TEMPORARY ALIAS...
const book = activeBook ?? null;
```
`activeBook` (уже вычислялся в хуке через `books.find(...)`) экспортируется напрямую из
return-объекта под своим именем вместо `book`. Больше никакая логика мутаций в этом файле не
менялась — только это точечное переименование в return.

## Изменённые файлы целиком

### apps/studio/src/components/NewBookDialog.tsx

```tsx
"use client";

import { useState } from "react";
import type { Book } from "@/domain/model";

const GENRES = [
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

type NewBookDialogProps = {
  onCancel: () => void;
  onCreate: (book: Omit<Book, "id" | "chapters" | "characters">) => void;
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
            <input
              type="text"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
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

### apps/studio/src/components/Sidebar.tsx

```tsx
import type { Book, Chapter, Character } from "@/domain/model";

type SidebarProps = {
  books?: readonly Book[];
  activeBookId?: string | null;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onSelectChapter?: (id: string) => void;
  onSelectScene?: (chapterId: string, sceneId: string) => void;
  characters?: readonly Character[];
  selectedCharacterId?: string | null;
  onSelectCharacter?: (id: string) => void;
  onCreateCharacter?: () => void;
  onSelectBook?: (bookId: string) => void;
  onNewBook?: () => void;
  onCreateChapter?: () => void;
  onCreateScene?: (chapterId: string) => void;
};

export function Sidebar({
  books = [],
  activeBookId,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onSelectChapter,
  onSelectScene,
  characters = [],
  selectedCharacterId,
  onSelectCharacter,
  onCreateCharacter,
  onSelectBook,
  onNewBook,
  onCreateChapter,
  onCreateScene,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Book
          </h2>
          <button
            onClick={() => onNewBook?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + New Book
          </button>
        </div>
        {books.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No books yet
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {books.map((book) => (
              <li key={book.id}>
                <button
                  onClick={() => onSelectBook?.(book.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    book.id === activeBookId
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-black hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {book.title || "Untitled Book"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Chapters
          </h2>
          <button
            onClick={() => onCreateChapter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + New Chapter
          </button>
        </div>
        {chapters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No chapters yet
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectChapter?.(chapter.id)}
                    className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                      selectedChapterId === chapter.id && !selectedSceneId
                        ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {chapter.title}
                  </button>
                  <button
                    onClick={() => onCreateScene?.(chapter.id)}
                    className="shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    + New Scene
                  </button>
                </div>
                {chapter.scenes.length > 0 && (
                  <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {chapter.scenes.map((scene) => (
                      <li key={scene.id}>
                        <button
                          onClick={() => onSelectScene?.(chapter.id, scene.id)}
                          className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                            selectedChapterId === chapter.id &&
                            selectedSceneId === scene.id
                              ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {scene.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Characters
          </h2>
          <button
            onClick={() => onCreateCharacter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + New Character
          </button>
        </div>
        {characters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No characters yet
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {characters.map((character) => (
              <li key={character.id}>
                <button
                  onClick={() => onSelectCharacter?.(character.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    selectedCharacterId === character.id
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {character.name || "Untitled Character"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
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

### apps/studio/src/workspace/useWorkspaceController.ts (только изменённый фрагмент — единственная правка: удалён временный алиас, `activeBook` теперь экспортируется напрямую; остальная логика мутаций не менялась)

```typescript
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
    // ... (unchanged from Step 01)
```
```typescript
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
npx tsc --noEmit → 0 ошибок во всём проекте — обе ранее ожидаемые ошибки из Step 01
                     (page.tsx's selectBook-сигнатура, NewBookDialog.tsx's Book type mismatch)
                     исчезли, как и требовалось.
npm run build → успешно (Compiled successfully)
npm run lint  → чисто
npx prettier --check → чисто
git status --short → ровно 4 файла из Allowed paths (NewBookDialog.tsx, Sidebar.tsx, page.tsx,
                       useWorkspaceController.ts — все M); EditorArea.tsx/CharacterPanel.tsx/
                       domain/**/storage/**/ai/**/api/** не тронуты
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Код-ревью: `handleSelectBook` корректно различает клик по активной/неактивной книге; список книг
в Sidebar использует тот же паттерн подсветки, что Chapters/Characters; `activeBook` (бывший
`book`) корректно прокидывается в `EditorArea`. Прошу лично проверить: создать вторую книгу — обе
видны в списке, активная подсвечена; клик на неактивную — переключение с показом её глав/
персонажей; клик на уже активную (из состояния "выбрана сцена") — возврат к обзору книги, не
no-op; создание третьей книги не стирает предыдущие две.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
