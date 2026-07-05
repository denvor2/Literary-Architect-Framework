# ARP — Sprint-10-Step-03

**Шаг:** Fix: автовыделение нового персонажа + автофокус на имени + поле photoUrl
**Статус выполнения:** Готово к ревью

## Что сделано

1. **Баг 1 — автовыделение нового персонажа.** `createCharacter()` в
   `useWorkspaceController.ts` переписан ровно по Step Card: теперь одновременно с добавлением
   персонажа устанавливает `selectedCharacterId` на id только что созданного персонажа и
   сбрасывает `selectedChapterId`/`selectedSceneId` в `null` — по симметрии с `selectCharacter`
   (Sprint-10-Step-02).
2. **Баг 2 — автофокус на "Name".** В `CharacterPanel.tsx` добавлен `useRef<HTMLInputElement>`
   на поле Name + `useEffect` с зависимостью **только** от `character?.id` (не от всего объекта
   `character`), который вызывает `.focus()` при каждой смене выбранного персонажа, включая
   только что созданного. Хук вызывается безусловно, до раннего `return` для случая
   "нет персонажа" (Rules of Hooks).
3. **Новое поле `photoUrl`:**
   - `model.ts` — добавлено `readonly photoUrl: string` в тип `Character`.
   - `useWorkspaceController.ts` — `updateCharacter`'s `fields` расширен до
     `Partial<Pick<Character, "name" | "description" | "notes" | "photoUrl">>`; `createCharacter`
     инициализирует новый персонаж с `photoUrl: ""`.
   - `CharacterPanel.tsx` — новое поле ввода URL (обычный `input`, placeholder "Ссылка на
     изображение...", `onChange` → `onUpdate({ photoUrl })`). Если `photoUrl` не пустой —
     показывается превью `<img>` (`h-40 w-40 rounded-lg object-cover`) над остальными полями;
     если пустой — ничего не рендерится (без плейсхолдера-заглушки). Загрузка файлов не
     реализована — только текстовое поле URL, как и требовал Step Card.

Названия полей UI оставлены на английском (Name / Photo URL / Description / Notes) — как и
весь остальной интерфейс сейчас; локализация — Sprint 14, не в этом шаге.

## Поправка (UI-Style-Guide-Amendments.md), внесена до коммита

Шаг ещё не был закоммичен, когда пришла поправка — по её же условию ("если ещё не закоммичен")
внёс правку прямо в тот же диф, не отдельным ARP. Кнопка "Удалить персонажа" в
`CharacterPanel.tsx`: цвет рамки/текста заменён с нейтрального `zinc` на `red` (разрушительное
действие = красный акцент, по новой цветовой семантике из `Add-UI-Style-Guide.md`). Форма
(`rounded-full`, padding) не менялась — только цвет:
`border-red-300 text-red-600 hover:bg-red-50` (light) /
`border-red-800 text-red-400 hover:bg-red-950` (dark). `build`/`lint` перепроверены после
правки — чисто.

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

### apps/studio/src/components/CharacterPanel.tsx

```tsx
import { useEffect, useRef } from "react";
import type { Character } from "@/domain/model";

type CharacterPanelProps = {
  character?: Character;
  onUpdate?: (
    fields: Partial<
      Pick<Character, "name" | "description" | "notes" | "photoUrl">
    >,
  ) => void;
  onDelete?: () => void;
};

// Sprint-10-Step-02: a Character's editing surface — deliberately simpler
// than EditorArea (no AI Bus, no modes), since Characters have no AI Expert
// at this stage.
export function CharacterPanel({
  character,
  onUpdate,
  onDelete,
}: CharacterPanelProps) {
  // Sprint-10-Step-03: focus the Name field whenever the selected character
  // changes (including a just-created one) — keyed on character?.id only, so
  // typing into the field doesn't keep re-triggering the focus.
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, [character?.id]);

  if (!character) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Select a character
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto p-8">
      <div className="flex w-full flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {character.name || "Untitled Character"}
          </h1>
          <button
            onClick={() => {
              if (window.confirm("Удалить персонажа?")) {
                onDelete?.();
              }
            }}
            className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Удалить персонажа
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Name
          </label>
          <input
            ref={nameInputRef}
            value={character.name}
            onChange={(event) => onUpdate?.({ name: event.target.value })}
            placeholder="Character name..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Photo URL
          </label>
          <input
            value={character.photoUrl}
            onChange={(event) => onUpdate?.({ photoUrl: event.target.value })}
            placeholder="Ссылка на изображение..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          {character.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, not a build-time optimizable local asset
            <img
              src={character.photoUrl}
              alt={character.name || "Character photo"}
              className="h-40 w-40 rounded-lg object-cover"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Description
          </label>
          <textarea
            value={character.description}
            onChange={(event) =>
              onUpdate?.({ description: event.target.value })
            }
            placeholder="Who is this character..."
            className="min-h-32 w-full flex-1 resize-none rounded-md border border-zinc-300 bg-white p-3 text-base leading-relaxed text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Notes
          </label>
          <textarea
            value={character.notes}
            onChange={(event) => onUpdate?.({ notes: event.target.value })}
            placeholder="Additional notes..."
            className="min-h-32 w-full flex-1 resize-none rounded-md border border-zinc-300 bg-white p-3 text-base leading-relaxed text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>
    </main>
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
    createScene,
    updateSceneText,
    selectChapter,
    selectScene,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
  };
}
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто (после исправления однострочного eslint-disable для <img> —
                 изначальный двухстрочный комментарий ломал next-line-таргетинг директивы,
                 см. ниже)
git status --short → ровно 3 файла из Allowed paths (model.ts, CharacterPanel.tsx,
                       useWorkspaceController.ts — все M); Sidebar.tsx/EditorArea.tsx/page.tsx/
                       ai/**/api/**/storage/** не тронуты
```

Мелкая самокоррекция в процессе: первая версия `eslint-disable-next-line` для `<img>` была
написана в две строки (текст пояснения переносился на следующую строку) — из-за этого директива
фактически отключала правило для строки комментария, а не для `<img>` двумя строками ниже, и
lint показывал одновременно "unused eslint-disable" и саму исходную warning. Исправлено в один
однострочный комментарий прямо над `<img>` — `npm run lint` подтвердил чистый результат.

**Живая проверка (честно, ограничение среды):** нет браузера/DevTools — то же ограничение, что
и во всех предыдущих UI-шагах. Автофокус (`useRef`+`useEffect`+DOM `.focus()`) и визуальное
превью `<img>` — оба принципиально требуют реального DOM/браузера для наблюдения; в проекте нет
jsdom/testing-library (проверил `node_modules` — отсутствуют), добавлять новую зависимость ради
этой проверки не стал — вне scope. Сделано: code review логики (эффект зависит только от
`character?.id`, что и требовалось, чтобы не перехватывать фокус на каждое нажатие клавиши) +
`build`/`lint`. **Прошу вас лично проверить в браузере**: создать персонажа → форма пустая,
курсор сразу в Name; ввести URL картинки → превью появляется; переключиться на другого персонажа
и обратно → данные корректные, фокус на Name при каждом переключении.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
