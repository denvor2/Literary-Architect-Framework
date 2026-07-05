# ARP — Sprint-10-Step-02

**Шаг:** UI: список персонажей в Sidebar + панель редактирования
**Статус выполнения:** Готово к ревью

## Что сделано

1. **`Sidebar.tsx`** — добавлена секция "Characters" по образцу секции "Chapters": h2
   uppercase-заголовок, пустое состояние "No characters yet", список кнопок (текст —
   `character.name || "Untitled Character"`, клик → `onSelectCharacter`), подсветка выбранного —
   тот же паттерн классов (`bg-zinc-200`/`dark:bg-zinc-800`), что у chapter/scene. Кнопка
   "+ New Character" рядом с заголовком секции → `onCreateCharacter`. Новые пропсы: `characters`,
   `selectedCharacterId`, `onSelectCharacter`, `onCreateCharacter`.
2. **`CharacterPanel.tsx`** (новый файл) — простой редактор персонажа без AI Bus и без режимов:
   поле `name` (input), `description` и `notes` (textarea), все три — `onChange` (см. "Отклонения/
   решения" ниже), кнопка "Удалить персонажа" с `window.confirm` перед вызовом `onDelete`.
   Пустое состояние ("Select a character") на случай, если `selectedCharacterId` указывает на
   несуществующего персонажа.
3. **`page.tsx`** — деструктурированы новые поля/функции из `useWorkspaceController`
   (`characters`, `selectedCharacterId`, `selectedCharacter`, `createCharacter`,
   `updateCharacter`, `deleteCharacter`, `selectCharacter`); проброшены в `Sidebar`; добавлен
   рендер `CharacterPanel` вместо `EditorArea`, когда `selectedCharacterId` установлен (простое
   тернарное условие на месте текущего рендера `EditorArea`).
4. **`useWorkspaceController.ts`** — ровно два точечных дополнения, как указано в Step Card:
   `selectChapter` и `selectScene` теперь дополнительно устанавливают `selectedCharacterId: null`
   (взаимоисключающий выбор). Больше ничего в файле не изменено.

## Решения, оставленные на моё усмотрение Step Card'ом

- **`onChange`, а не `onBlur`**, для всех трёх полей `CharacterPanel` — та же стратегия, что уже
  используется для текста сцены в `EditorArea.tsx` (`onChangeSceneText` тоже вызывается на каждое
  изменение). Выбрано ради консистентности поведения между двумя панелями редактирования, а не
  ради технической необходимости.
- **`window.confirm` перед удалением — оставлен.** Хотя для сцен подтверждения сейчас нет
  вообще (там просто нет функции удаления), удаление персонажа необратимо и может стереть
  накопленные заметки/описание — счёл более безопасным сохранить лёгкое подтверждение, а не
  соответствовать отсутствующему прецеденту.

## Замеченный пограничный случай — устранён по санкции Architect (REVIEW.md)

`selectCharacter` изначально не сбрасывал `selectedChapterId`/`selectedSceneId` — Step Card
прямо ограничил разрешённые правки в `useWorkspaceController.ts` только `selectChapter`/
`selectScene` ("ничего больше в этом файле не менять"), поэтому я не полез чинить это
самовольно и только зафиксировал наблюдение в ARP. Architect в REVIEW.md разрешил точечное
добавление по симметрии — внесено:

```typescript
function selectCharacter(characterId: string) {
  setWorkspace((previous) => ({
    ...previous,
    selectedCharacterId: characterId,
    selectedChapterId: null,
    selectedSceneId: null,
  }));
}
```

Теперь взаимоисключающий выбор симметричен во все три стороны. `npm run build`/`npm run lint`
перепроверены после добавления — чисто.

## Изменённые/новые файлы целиком

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
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Book
        </h2>
        <p className="text-sm text-black dark:text-zinc-100">
          {bookTitle ?? "Untitled Book"}
        </p>
      </div>
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Chapters
        </h2>
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
            className="text-xs font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
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

### apps/studio/src/components/CharacterPanel.tsx (новый файл)

```tsx
import type { Character } from "@/domain/model";

type CharacterPanelProps = {
  character?: Character;
  onUpdate?: (
    fields: Partial<Pick<Character, "name" | "description" | "notes">>,
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
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Удалить персонажа
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Name
          </label>
          <input
            value={character.name}
            onChange={(event) => onUpdate?.({ name: event.target.value })}
            placeholder="Character name..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
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
  } = useWorkspaceController();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Ephemeral UI state only — not part of Workspace, not persisted.
  const [isFocusMode, setIsFocusMode] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-white font-sans dark:bg-black">
      <Header onNewBook={() => setIsDialogOpen(true)} />
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

### apps/studio/src/workspace/useWorkspaceController.ts (только изменённые фрагменты — весь остальной файл не менялся)

```typescript
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

  // ...

  function selectCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedCharacterId: characterId,
      selectedChapterId: null,
      selectedSceneId: null,
    }));
  }
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
git status --short → ровно Allowed paths (Sidebar.tsx, page.tsx, useWorkspaceController.ts —
                       M; CharacterPanel.tsx — новый); EditorArea.tsx, domain/**, storage/**,
                       ai/**, app/api/** не тронуты
```

**Живая проверка (честно, ограничение среды):** в этой среде нет инструмента браузерной
автоматизации (кликов/ввода текста) — та же, ранее уже озвученная проблема, что и во всех
предыдущих UI-шагах (Sprint 08/09). Реально выполнено: `npm run build` (production build) +
`npm run start` на отдельном порту (4173) + `curl` подтвердил, что страница отдаёт 200 и
рендерится без серверной ошибки. Функциональность создания/редактирования/удаления персонажа,
переключения между `EditorArea`/`CharacterPanel` и сохранения в `localStorage` при перезагрузке
проверена только через код-ревью логики (`useWorkspaceController.ts` использует тот же
`saveWorkspace`/`loadWorkspace`, что уже живо проверялся для Scene в предыдущих спринтах, и та же
immutable-мутация), не через фактический клик в браузере. В проекте нет установленного
тестового фреймворка (jsdom/testing-library/vitest) — добавлять новую зависимость ради одной
проверки посчитал избыточным и вне scope этого шага; not attempted.

## Отклонения от Step Card

Помимо решений, явно оставленных на моё усмотрение (см. выше, `onChange` vs `onBlur` и
`window.confirm`), других отклонений нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect. Это последний шаг Sprint 10.

Жду REVIEW.md.
