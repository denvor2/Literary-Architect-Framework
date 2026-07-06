# ARP — Sprint-10-Step-06

**Шаг:** Fix: автовыделение новой сцены + редактируемое название сцены
**Статус выполнения:** Готово к ревью

## Важное отклонение от Allowed paths — прошу подтвердить

Step Card перечисляет Allowed paths только `useWorkspaceController.ts` и `EditorArea.tsx`, но
сам Objective прямо требует: *"page.tsx — передать updateSceneTitle в EditorArea как
onUpdateSceneTitle"*. Без этой правки `onUpdateSceneTitle` был бы объявлен, но никогда не
передан — фича осталась бы нерабочей при формальном соответствии Allowed paths. `page.tsx` при
этом не значится и в Forbidden paths (там только Sidebar.tsx/CharacterPanel.tsx/domain/**/
storage/**/ai/**/api/**). Расцениваю это как, по всей видимости, случайный пропуск `page.tsx` в
списке Allowed paths, а не намеренное ограничение — и вношу минимальную необходимую правку
(проброс двух пропов), а не более широкую. Явно флагирую это, а не решаю молча — поправьте, если
это было намеренно и правку нужно откатить.

## Что сделано

### 1. Автовыделение новой сцены

`createScene(chapterId?)` в `useWorkspaceController.ts` переписан ровно по коду из Step Card:
находит `targetChapter` явно (по `targetChapterId`), и если он существует — добавляет сцену,
затем устанавливает `selectedChapterId: targetChapterId` и `selectedSceneId: newSceneId`
(сбрасывая `selectedCharacterId`). Работает одинаково независимо от того, была ли сцена создана
кнопкой в `EditorArea` (без явного `chapterId`, fallback на `previous.selectedChapterId`) или
кнопкой "+ New Scene" в Sidebar для произвольной, не обязательно текущей выбранной, главы.

### 2. Редактируемое название сцены

- `useWorkspaceController.ts` — добавлена `updateSceneTitle(chapterId, sceneId, title)` по
  аналогии с `updateSceneText` (immutable `.map()` по `chapters` → `scenes`).
- `EditorArea.tsx` — в ветке "выбраны и Chapter, и Scene" статичный `<h1>` с названием сцены
  заменён на редактируемый `<input>` (`onChange` → `onUpdateSceneTitle`), с менее акцентным
  размером шрифта (`text-lg font-medium`), чем у заголовка главы (`text-2xl font-semibold`) —
  название сцены служебное и не должно визуально доминировать так же. Текст сцены (textarea)
  не тронут — два разных поля, оба независимо редактируемые.
- `page.tsx` — `updateSceneTitle` из контроллера передан в `EditorArea` как `onUpdateSceneTitle`
  (см. отклонение выше).

`Sidebar.tsx` не тронут — название сцены там уже корректно отображается через `scene.title`, как
и требовал Step Card.

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
      const targetChapter = previous.chapters.find(
        (chapter) => chapter.id === targetChapterId,
      );
      if (!targetChapter) return previous;
      const nextNumber = targetChapter.scenes.length + 1;
      const newSceneId = String(nextNumber);
      return {
        ...previous,
        chapters: previous.chapters.map((chapter) =>
          chapter.id === targetChapterId
            ? {
                ...chapter,
                scenes: [
                  ...chapter.scenes,
                  { id: newSceneId, title: `Scene ${nextNumber}`, text: "" },
                ],
              }
            : chapter,
        ),
        selectedChapterId: targetChapterId,
        selectedSceneId: newSceneId,
        selectedCharacterId: null,
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

  function updateSceneTitle(chapterId: string, sceneId: string, title: string) {
    setWorkspace((previous) => ({
      ...previous,
      chapters: previous.chapters.map((chapter) => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          scenes: chapter.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, title } : scene,
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
        character.id === characterId ? { ...character, ...fields } : character,
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
    updateSceneTitle,
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
            onUpdate={(fields) => updateCharacter(selectedCharacterId, fields)}
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
  onUpdateSceneTitle?: (
    chapterId: string,
    sceneId: string,
    title: string,
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
  isFocusMode = false,
  onToggleFocusMode,
}: EditorAreaProps) {
  // ... (unchanged: textareaRef, !book branch, selectedChapter/selectedScene lookups)

  if (selectedChapter && selectedScene) {
    // ... (unchanged: trimmed/wordCount/characterCount, getSelectedText())

    return (
      <main className="flex flex-1 flex-col overflow-y-auto p-8">
        <div
          className={`flex w-full flex-1 flex-col gap-3 ${
            isFocusMode ? "mx-auto max-w-3xl" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <input
              value={selectedScene.title}
              onChange={(event) =>
                onUpdateSceneTitle?.(
                  selectedChapter.id,
                  selectedScene.id,
                  event.target.value,
                )
              }
              placeholder="Scene title..."
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-lg font-medium tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              onClick={onToggleFocusMode}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {isFocusMode ? "Exit Focus" : "Фокус"}
            </button>
          </div>
          {/* ... (unchanged: textarea for scene text, SceneImprove) */}
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
npx prettier --check → изначально нашёл проблемы форматирования в useWorkspaceController.ts и
                 page.tsx (длина строки, разбивка тернарных выражений) — исправлено через
                 `prettier --write` на оба файла, перепроверено чисто. Побочный эффект: это
                 заодно нормализовало форматирование одной уже существующей, не связанной со
                 мной строки в updateCharacter() (тернарник схлопнут в одну строку) и одной
                 строки в page.tsx (onUpdate CharacterPanel) — чисто форматирование, без
                 изменения логики/поведения; не результат ручной правки с моей стороны.
git status --short → 3 файла: useWorkspaceController.ts, EditorArea.tsx (оба — заявленный
                 Allowed scope), page.tsx (см. явно флагированное отклонение выше);
                 Sidebar.tsx/CharacterPanel.tsx/domain/**/storage/**/ai/**/api/** не тронуты
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Код-ревью: `createScene` теперь всегда явно ищет `targetChapter` и обновляет выбор на именно ту
главу/сцену, куда добавлена сцена — включая случай кнопки в Sidebar для не-текущей главы.
`updateSceneTitle` — точная копия паттерна `updateSceneText`, только поле `title` вместо `text`.
Прошу лично проверить: создать сцену в конкретной главе через кнопку в сайдбаре, когда выбрана
ДРУГАЯ глава — автоматически выделяется именно та глава и та сцена; изменить название сцены в
EditorArea — обновляется и в самом EditorArea, и в списке слева (Sidebar), сохраняется после
перезагрузки страницы.

## Отклонения от Step Card

Единственное — уже подробно описанное выше: правка `page.tsx` (двух пропов), не входящего в
буквальный список Allowed paths, но прямо требуемого текстом Objective и не входящего в
Forbidden paths. Прошу явно подтвердить или попросить откатить.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
