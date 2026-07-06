# ARP — Sprint-10-Step-05

**Шаг:** Fix: автовыделение новой главы + панель редактирования главы (заголовок/подзаголовок) +
кнопка New Scene в сайдбаре
**Статус выполнения:** Готово к ревью

## Что сделано

### 1. Автовыделение новой главы

`createChapter()` в `useWorkspaceController.ts` переписан ровно по Step Card: одновременно с
добавлением главы устанавливает `selectedChapterId` на id новой главы, сбрасывает
`selectedSceneId`/`selectedCharacterId` в `null` — по аналогии с `createCharacter`.

### 2. Поле `subtitle` у Chapter

- `model.ts` — добавлено `readonly subtitle: string` в тип `Chapter`.
- `useWorkspaceController.ts` — добавлена `updateChapter(chapterId, fields)`
  (`Partial<Pick<Chapter, "title" | "subtitle">>`, immutable `.map()`, по аналогии с
  `updateCharacter`). `createBook()` и `createChapter()` инициализируют новую главу с
  `subtitle: ""`.

### 3. Панель редактирования главы

`EditorArea.tsx` — состояние "выбрана Chapter, но не Scene" теперь показывает над кнопкой "New
Scene" два редактируемых поля: Title (input) и Subtitle (input), меняющие значение через новый
проп `onUpdateChapter`, обновление на `onChange` (та же стратегия, что уже принята для
Character в Sprint-10-Step-03).

### 4. Кнопка "+ New Scene" в сайдбаре

- `Sidebar.tsx` — маленькая контурная кнопка "+ New Scene" рядом с названием каждой главы (в
  общем ряду flex, `shrink-0`, чтобы не сжиматься при длинном названии главы), вызывает новый
  проп `onCreateScene(chapterId)`. Тот же стиль, что "+ New Character"/"+ New Chapter"
  (`border`, `rounded-md`, компактный padding — по `UI_STYLE_GUIDE.md`).
- `useWorkspaceController.ts` — `createScene()` расширена до `createScene(chapterId?: string)`:
  если `chapterId` передан — используется явно; если нет — fallback на
  `previous.selectedChapterId` (текущее поведение для существующего вызова из `EditorArea`
  сохранено без изменений — `onNewScene={createScene}` по-прежнему работает без обёртки).
- `page.tsx` — `onCreateScene={createScene}` передан в `Sidebar` напрямую (сигнатура
  `(chapterId?: string) => void` совместима с ожидаемым `(chapterId: string) => void`).

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
  readonly title: string;
  readonly genre: string;
  readonly language: string;
  readonly premise: string;
};

export type Character = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly notes: string;
  readonly photoUrl: string;
};
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
          subtitle: "",
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
      const newChapter: Chapter = {
        id: String(nextNumber),
        title: `Chapter ${nextNumber}`,
        subtitle: "",
        scenes: [{ id: "1", title: "Scene 1", text: "" }],
      };
      return {
        ...previous,
        chapters: [...previous.chapters, newChapter],
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
    setWorkspace((previous) => ({
      ...previous,
      chapters: previous.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, ...fields } : chapter,
      ),
    }));
  }

  function createScene(chapterId?: string) {
    setWorkspace((previous) => {
      const targetChapterId = chapterId ?? previous.selectedChapterId;
      if (!targetChapterId) return previous;
      return {
        ...previous,
        chapters: previous.chapters.map((chapter) => {
          if (chapter.id !== targetChapterId) return chapter;
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
    updateChapter,
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
  onCreateScene?: (chapterId: string) => void;
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
  onCreateScene,
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
    book,
    chapters,
    selectedChapterId,
    selectedSceneId,
    createBook,
    createChapter,
    updateChapter,
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
            onCreateScene={createScene}
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
            onUpdateChapter={updateChapter}
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

### apps/studio/src/components/EditorArea.tsx (только изменённые фрагменты — файл 720+ строк, остальное не менялось)

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
  isFocusMode = false,
  onToggleFocusMode,
}: EditorAreaProps) {
  // ... (unchanged: textareaRef, !book branch, selectedChapter/selectedScene lookups,
  //      the "selectedChapter && selectedScene" branch)

  if (selectedChapter) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <div className="flex w-full max-w-md flex-col gap-2">
          <input
            value={selectedChapter.title}
            onChange={(event) =>
              onUpdateChapter?.(selectedChapter.id, {
                title: event.target.value,
              })
            }
            placeholder="Chapter title..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-2xl font-semibold tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            value={selectedChapter.subtitle}
            onChange={(event) =>
              onUpdateChapter?.(selectedChapter.id, {
                subtitle: event.target.value,
              })
            }
            placeholder="Subtitle..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-center text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
        </div>
        {selectedChapter.scenes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No scenes yet
          </p>
        ) : (
          <ul className="text-sm text-zinc-600 dark:text-zinc-400">
            {selectedChapter.scenes.map((scene) => (
              <li key={scene.id}>{scene.title}</li>
            ))}
          </ul>
        )}
        <button
          onClick={onNewScene}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          New Scene
        </button>
      </main>
    );
  }
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок — подтверждает, что
                 createScene(chapterId?: string) корректно совместим и с onNewScene={createScene}
                 (без аргумента), и с onCreateScene={createScene} (с обязательным аргументом
                 в типе пропа))
npm run lint  → чисто
git status --short → ровно 5 файлов из объединённого Allowed scope (model.ts,
                       useWorkspaceController.ts, Sidebar.tsx, EditorArea.tsx, page.tsx);
                       CharacterPanel.tsx/domain/workspace.ts/storage/**/ai/**/api/** не тронуты
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Сделано: код-ревью (все четыре пункта реализованы ровно по спецификации; `createScene`'s
fallback-логика сохраняет старое поведение для существующего вызова из `EditorArea`) +
`build`/`lint`. Прошу лично проверить: создать главу — автоматически выделяется, видна форма
Title/Subtitle; ввести текст в оба поля — сохраняется (перезагрузка страницы); нажать
"+ New Scene" на конкретной главе в сайдбаре, когда выбрана ДРУГАЯ глава — сцена добавляется
именно в ту главу, на которой была нажата кнопка, а не в текущую выбранную.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
