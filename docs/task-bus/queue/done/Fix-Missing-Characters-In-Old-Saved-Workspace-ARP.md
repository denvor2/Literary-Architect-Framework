# ARP — Fix-Missing-Characters-In-Old-Saved-Workspace

**Задача:** СРОЧНО — чинить краш `characters.find` на старых сохранённых Workspace
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/storage/workspaceStorage.ts`, `loadWorkspace()`: при успешном парсинге
сохранённых данных результат теперь сливается поверх `EMPTY_WORKSPACE` (`{ ...EMPTY_WORKSPACE,
...JSON.parse(raw) }`), а не подставляется как есть. Старые Workspace, сохранённые до Sprint 10
(без полей `characters`/`selectedCharacterId`), при загрузке теперь получают эти поля из
дефолта, а не `undefined` — устраняет краш `Cannot read properties of undefined (reading
'find')` в `useWorkspaceController.ts:61`. Правка ровно та, что была продиктована в Step Card,
без отклонений. `saveWorkspace()` не тронут. Никакого версионирования схемы не введено.

## Изменённый файл целиком

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
    if (!raw) return EMPTY_WORKSPACE;
    return { ...EMPTY_WORKSPACE, ...(JSON.parse(raw) as Partial<Workspace>) };
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
git status --short → ровно 1 файл (workspaceStorage.ts, M) — единственный Allowed path
```

**Живая проверка — выполнена по-настоящему, не только код-ревью.** В этой среде нет браузера,
поэтому я не могу вручную вставить JSON в localStorage через DevTools, как предлагает Step
Card. Вместо этого выполнил эквивалентную проверку напрямую против реального, скомпилированного
`loadWorkspace()` — тот же приём, что применялся раньше для `aiBus.execute()` (Sprint 08/09):
временный скрипт (`npx tsx`, вне репозитория, в scratchpad) мокает `global.window.localStorage`
и импортирует `workspaceStorage.ts` напрямую через `file://`.

1. **Воспроизведение краша (старый формат).** `localStorage` замокан JSON без
   `characters`/`selectedCharacterId` (в точности формат до Sprint 10 — `book`, `chapters`,
   `selectedChapterId`, `selectedSceneId`). Вызов `loadWorkspace()` вернул:
   `characters: []`, `selectedCharacterId: null`, остальные поля (`book`, `chapters`,
   `selectedChapterId`, `selectedSceneId`) — как в сохранённых данных, без изменений. Краша нет,
   `characters` — валидный массив, а не `undefined`.
2. **Регрессия (новый формат).** `localStorage` замокан полным Workspace нового формата,
   включая непустой `characters` и `selectedCharacterId: "1"`. `loadWorkspace()` вернул данные
   без изменений — слияние не портит и не подменяет уже присутствующие поля.

Оба прогона — PASS. Это не замена буквальному ручному тесту в браузере (DevTools + реальный
Product Owner флоу), но это реальный вызов реальной, скомпилированной функции с реальными
данными, а не просто чтение кода.

## Отклонения от Step Card

Нет. Изменение — ровно то, что было продиктовано дословно (shallow-merge поверх
`EMPTY_WORKSPACE`), `saveWorkspace()` не тронут, новых зависимостей не добавлено.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect. Понимаю срочность (реальный краш у
Product Owner) — готов закоммитить сразу по получении OK.

Жду REVIEW.md.
