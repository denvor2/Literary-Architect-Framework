# ARP — Sprint-10-Step-01

**Шаг:** Домен-модель: сущность Character + хранение + мутации
**Статус выполнения:** Готово к ревью

## Что сделано

Персонажи добавлены в домен-модель тем же паттерном, что уже используется для Scene/Chapter —
чистое CRUD-расширение, без AI Expert'а и без UI (Step 02 — отдельный шаг).

1. **`apps/studio/src/domain/model.ts`** — добавлен тип `Character` (id/name/description/notes,
   все поля `readonly`, по образцу `Scene`).
2. **`apps/studio/src/domain/workspace.ts`** — в `Workspace` добавлены `characters: readonly
   Character[]` и `selectedCharacterId: string | null`; импорт `Character` обновлён.
3. **`apps/studio/src/storage/workspaceStorage.ts`** — `EMPTY_WORKSPACE` дополнен `characters:
   []`, `selectedCharacterId: null`. Никакая другая логика загрузки/сохранения не менялась.
4. **`apps/studio/src/workspace/useWorkspaceController.ts`**:
   - `EMPTY_WORKSPACE` дополнен тем же образом.
   - `createBook()` — явно инициализирует `characters: []` (новая книга без персонажей — это
     осознанный дефолт, с комментарием в коде).
   - Новые мутации по аналогии с существующими (immutable, `.map()`/`.filter()`/spread):
     `createCharacter()` (нумерация id тем же способом, что у сцен — `characters.length + 1`,
     пустые поля), `updateCharacter(characterId, fields)` (partial-обновление name/description/
     notes), `deleteCharacter(characterId)` (`.filter()`), `selectCharacter(characterId)`.
   - Новое derived-значение `selectedCharacter` (по аналогии с `selectedChapter`/
     `selectedScene`).
   - Существующие функции для Scene/Chapter не изменены.

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
};
```

### apps/studio/src/domain/workspace.ts

```typescript
import type { Book, Chapter, Character } from "./model";

export type Workspace = {
  book: Book | null;
  chapters: readonly Chapter[];
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  characters: readonly Character[];
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

import type { Workspace } from "@/domain/workspace";

const STORAGE_KEY = "literary-studio-workspace";

const EMPTY_WORKSPACE: Workspace = {
  book: null,
  chapters: [],
  selectedChapterId: null,
  selectedSceneId: null,
  characters: [],
  selectedCharacterId: null,
};

export function loadWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Workspace) : EMPTY_WORKSPACE;
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
    }));
  }

  function selectScene(chapterId: string, sceneId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: sceneId,
    }));
  }

  function createCharacter() {
    setWorkspace((previous) => {
      const nextNumber = previous.characters.length + 1;
      return {
        ...previous,
        characters: [
          ...previous.characters,
          { id: String(nextNumber), name: "", description: "", notes: "" },
        ],
      };
    });
  }

  function updateCharacter(
    characterId: string,
    fields: Partial<Pick<Character, "name" | "description" | "notes">>,
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
npm run lint  → чисто, без предупреждений
git status --short → ровно 4 файла из Allowed paths (M ×4) + Step Card в active/ (служебный,
                       не в счёт scope)
```

## Отклонения от Step Card

- `updateCharacter` типизирован как `Partial<Pick<Character, "name" | "description" |
  "notes">>` — сама сигнатура (`characterId`, `fields`) в точности как в Step Card; тип поля
  `fields` не был явно задан в задании, выбран как минимально достаточный (только три
  редактируемых поля, id неизменяем — иначе можно было бы случайно подменить id через fields).
  Флагирую как явное решение, не самовольное расширение.
- Других отклонений нет: UI не тронут, `apps/studio/src/ai/**` и `apps/studio/src/app/api/**`
  не тронуты, существующие функции для Scene/Chapter не изменены.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
