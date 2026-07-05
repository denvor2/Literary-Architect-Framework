# ARP — Sprint-10-Step-04 (+ Amendment)

**Шаг:** Fix: навигация обратно к книге + добавить createChapter + убрать мёртвую кнопку,
плюс поправка "переместить New Book в Sidebar, единый стиль"
**Статус выполнения:** Готово к ревью

Выполнено вместе, одним ARP, как и было указано (Amendment расширяет тот же шаг доп. scope'ом
на `Header.tsx`).

## Что сделано

### 1. Навигация назад к обзору книги

- `useWorkspaceController.ts` — добавлена `selectBook()`: сбрасывает
  `selectedChapterId`/`selectedSceneId`/`selectedCharacterId` в `null`. `EditorArea.tsx` уже
  умел рендерить обзор книги как финальный `return`, когда ни chapter, ни scene не выбраны —
  никаких изменений в `EditorArea.tsx` для этого пункта не потребовалось.
- `Sidebar.tsx` — блок "Book" стал кликабельной кнопкой (`onSelectBook`), с подсветкой активного
  состояния, когда `!selectedChapterId && !selectedSceneId && !selectedCharacterId`
  (`isBookSelected`).
- `page.tsx` — `selectBook` из контроллера передан в `Sidebar` как `onSelectBook`.

### 2. Добавить главу

- `useWorkspaceController.ts` — добавлена `createChapter()` по аналогии с `createScene()`/
  `createCharacter()`: нумерация `chapters.length + 1`, новая глава сразу с одной пустой сценой
  (`Scene 1`) — тот же паттерн, что уже в `createBook()` для первой главы.
- `Sidebar.tsx` — кнопка "+ New Chapter" рядом с заголовком секции "Chapters".
- `page.tsx` — `createChapter` передан в `Sidebar` как `onCreateChapter`.

### 3. Убрана мёртвая кнопка "New Scene" (ветка `!book` в EditorArea.tsx)

Кнопка без `onClick` (недостижимая — книга создаётся только через `NewBookDialog` из шапки/
сайдбара) убрана полностью; текст-подсказка заменён на "Create your first book to get started".

### Поправка — "New Book" переехал в Sidebar, единый стиль

- `Sidebar.tsx` — секция "Book" приведена к тому же виду строки заголовка, что у "Characters"/
  "Chapters" (h2 + кнопка справа в той же строке): "+ New Book" (контурная кнопка) вызывает
  новый проп `onNewBook`. Название книги (клик → `selectBook()`) и "+ New Book" (клик →
  `onNewBook`, открывает `NewBookDialog`) — два разных элемента, не спутаны.
- `Header.tsx` — кнопка "New Book" и проп `onNewBook` убраны полностью; остался только
  breadcrumb "Literary Studio / Untitled Book".
- `page.tsx` — проброс `onNewBook={() => setIsDialogOpen(true)}` перенесён из `<Header>` в
  `<Sidebar>`; `<Header />` теперь вызывается без пропов.

### Учтена поправка по стилю кнопок (UI-Style-Guide-Amendments.md)

И "+ New Chapter", и "+ New Book" сразу сделаны контурными кнопками (`border`, `rounded-md`,
компактный padding — тот же класс, что уже используется для "+ New Character" после
`Add-UI-Style-Guide`), а не по устаревшей ссылке на старый текст-линк паттерн, которую содержали
исходные тексты Step-04/Amendment.

## Изменённые файлы целиком

### apps/studio/src/components/Header.tsx

```tsx
export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-black">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Literary Studio
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Untitled Book
        </span>
      </div>
    </header>
  );
}
```

### apps/studio/src/components/Sidebar.tsx

```tsx
import type { Chapter, Character } from "@/domain/model";

type SidebarProps = {
  bookTitle?: string;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onSelectChapter?: (id: string) => void;
  onSelectScene?: (chapterId: string, sceneId: string) => void;
  characters?: readonly Character[];
  selectedCharacterId?: string | null;
  onSelectCharacter?: (id: string) => void;
  onCreateCharacter?: () => void;
  onSelectBook?: () => void;
  onNewBook?: () => void;
  onCreateChapter?: () => void;
};

export function Sidebar({
  bookTitle,
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
}: SidebarProps) {
  const isBookSelected =
    !selectedChapterId && !selectedSceneId && !selectedCharacterId;

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
        <button
          onClick={() => onSelectBook?.()}
          className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
            isBookSelected
              ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
              : "text-black hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
          }`}
        >
          {bookTitle ?? "Untitled Book"}
        </button>
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
                {chapter.scenes.length > 0 && (
                  <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {chapter.scenes.map((scene) => (
                      <li key={scene.id}>
                        <button
                          onClick={() => onSelectScene?.(chapter.id, scene.id)}
                          className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
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
    book,
    chapters,
    selectedChapterId,
    selectedSceneId,
    createBook,
    createChapter,
    createScene,
    updateSceneText,
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
  } = useWorkspaceController();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Ephemeral UI state only — not part of Workspace, not persisted.
  const [isFocusMode, setIsFocusMode] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white font-sans dark:bg-black">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {!isFocusMode && (
          <Sidebar
            bookTitle={book?.title}
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            selectedSceneId={selectedSceneId}
            onSelectChapter={selectChapter}
            onSelectScene={selectScene}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={selectCharacter}
            onCreateCharacter={createCharacter}
            onSelectBook={selectBook}
            onNewBook={() => setIsDialogOpen(true)}
            onCreateChapter={createChapter}
          />
        )}
        {selectedCharacterId ? (
          <CharacterPanel
            character={selectedCharacter}
            onUpdate={(fields) =>
              updateCharacter(selectedCharacterId, fields)
            }
            onDelete={() => deleteCharacter(selectedCharacterId)}
          />
        ) : (
          <EditorArea
            book={book}
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            selectedSceneId={selectedSceneId}
            onNewScene={createScene}
            onChangeSceneText={updateSceneText}
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

### apps/studio/src/workspace/useWorkspaceController.ts

```typescript
"use client";

import { useEffect, useState } from "react";
import type { Book, Character } from "@/domain/model";
import type { Workspace } from "@/domain/workspace";
import { loadWorkspace, saveWorkspace } from "@/storage/workspaceStorage";

// Used only as the pre-hydration initial state (see the restore effect
// below) — must match server render, so it cannot itself call
// loadWorkspace(), which depends on window.localStorage.
const EMPTY_WORKSPACE: Workspace = {
  book: null,
  chapters: [],
  selectedChapterId: null,
  selectedSceneId: null,
  characters: [],
  selectedCharacterId: null,
};

// Owns the Workspace domain state and every operation that mutates it —
// extracted unchanged from page.tsx (Sprint 06 Step 09). No new behavior:
// each exported function here is a straight move of the previous handler,
// same body, same call sites.
export function useWorkspaceController() {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY_WORKSPACE);
  const [isLoaded, setIsLoaded] = useState(false);
  const {
    book,
    chapters,
    selectedChapterId,
    selectedSceneId,
    characters,
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

  const selectedChapter = chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );
  const selectedScene = selectedChapter?.scenes.find(
    (scene) => scene.id === selectedSceneId,
  );
  const selectedCharacter = characters.find(
    (character) => character.id === selectedCharacterId,
  );

  function createBook(newBook: Book) {
    setWorkspace({
      book: newBook,
      chapters: [
        {
          id: "1",
          title: "Chapter 1",
          scenes: [{ id: "1", title: "Scene 1", text: "" }],
        },
      ],
      selectedChapterId: null,
      selectedSceneId: null,
      // A new book starts with no characters — the writer adds them later.
      characters: [],
      selectedCharacterId: null,
    });
  }

  function createChapter() {
    setWorkspace((previous) => {
      const nextNumber = previous.chapters.length + 1;
      return {
        ...previous,
        chapters: [
          ...previous.chapters,
          {
            id: String(nextNumber),
            title: `Chapter ${nextNumber}`,
            scenes: [{ id: "1", title: "Scene 1", text: "" }],
          },
        ],
      };
    });
  }

  function createScene() {
    setWorkspace((previous) => {
      if (!previous.selectedChapterId) return previous;
      return {
        ...previous,
        chapters: previous.chapters.map((chapter) => {
          if (chapter.id !== previous.selectedChapterId) return chapter;
          const nextNumber = chapter.scenes.length + 1;
          return {
            ...chapter,
            scenes: [
              ...chapter.scenes,
              {
                id: String(nextNumber),
                title: `Scene ${nextNumber}`,
                text: "",
              },
            ],
          };
        }),
      };
    });
  }

  function updateSceneText(chapterId: string, sceneId: string, text: string) {
    setWorkspace((previous) => ({
      ...previous,
      chapters: previous.chapters.map((chapter) => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          scenes: chapter.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, text } : scene,
          ),
        };
      }),
    }));
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
      const nextNumber = previous.characters.length + 1;
      const newCharacter: Character = {
        id: String(nextNumber),
        name: "",
        description: "",
        notes: "",
        photoUrl: "",
      };
      return {
        ...previous,
        characters: [...previous.characters, newCharacter],
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
    setWorkspace((previous) => ({
      ...previous,
      characters: previous.characters.map((character) =>
        character.id === characterId
          ? { ...character, ...fields }
          : character,
      ),
    }));
  }

  function deleteCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      characters: previous.characters.filter(
        (character) => character.id !== characterId,
      ),
    }));
  }

  function selectCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedCharacterId: characterId,
      selectedChapterId: null,
      selectedSceneId: null,
    }));
  }

  function selectBook() {
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
    createScene,
    updateSceneText,
    selectChapter,
    selectScene,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    selectBook,
  };
}
```

### apps/studio/src/components/EditorArea.tsx (только изменённый фрагмент — файл 710 строк, остальное не менялось)

```tsx
  if (!book) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Create your first book to get started
        </p>
      </main>
    );
  }
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
git status --short → ровно объединённый Allowed scope Step-04 (useWorkspaceController.ts,
                       Sidebar.tsx, EditorArea.tsx, page.tsx) + Amendment (Header.tsx);
                       CharacterPanel.tsx/domain/**/storage/**/ai/**/api/** не тронуты
grep "Header" apps/studio/src/**/*.tsx → единственный вызов <Header /> без пропов, в page.tsx —
                       регрессии со старым onNewBook нет
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Сделано: код-ревью (все три пункта основного Step Card + оба пункта Amendment реализованы
ровно так, как продиктовано; `isBookSelected` корректно учитывает все три вида выбора) +
`build`/`lint`. Прошу лично проверить: создать вторую главу — появляется в списке с новой пустой
сценой; клик "Book" из состояния "выбрана сцена/персонаж" — возврат к обзору книги, подсветка
корректна; "+ New Book" в Sidebar открывает тот же диалог, что раньше открывался из шапки; шапка
больше не содержит кнопку; мёртвая кнопка в ветке `!book` действительно отсутствует.

## Отклонения от Step Card

Единственное сознательное отклонение — уже описанное и предписанное самой поправкой
`UI-Style-Guide-Amendments.md`: "+ New Chapter" и "+ New Book" сделаны контурными кнопками сразу
(класс, идентичный уже одобренному "+ New Character"), а не по буквальной формулировке
исходных Step-04/Amendment ("тот же паттерн, что + New Character" — имея в виду СТАРЫЙ,
текст-линк паттерн, который к моменту выполнения этого шага уже был заменён). Остальное — без
отклонений.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
