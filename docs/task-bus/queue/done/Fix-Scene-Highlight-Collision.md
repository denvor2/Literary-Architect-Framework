id: Fix-Scene-Highlight-Collision
name: "СРОЧНО: фикс одновременной подсветки сцен с одинаковым id в разных главах"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/Sidebar.tsx

Forbidden paths:
- всё остальное

## Objective

Реальный баг, подтверждён скриншотом Product Owner: Scene id
нумеруется внутри своей главы (chapter.scenes.length + 1) — поэтому
первая сцена в разных главах имеет одинаковый id ("1"). Подсветка
в Sidebar.tsx сравнивает только `selectedSceneId === scene.id`, не
учитывая chapterId — поэтому подсвечиваются ОБЕ одноимённые сцены
в разных главах одновременно.

Сами данные не путаются (загрузка текста идёт через selectedChapter,
корректно) — баг чисто визуальный, в условии подсветки.

Исправление — добавить проверку chapterId в условие:

```typescript
className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
  selectedChapterId === chapter.id && selectedSceneId === scene.id
    ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
}`}
```

(chapter.id доступен в замыкании — это внутри chapters.map(chapter =>
... chapter.scenes.map(scene => ...)), просто раньше не
использовался в этом конкретном условии).

## Rules

- Минимальное изменение — только это одно условие подсветки.
- Не трогай ничего другого в файле.

## Validation

- npm run build / npm run lint — чисто.
- git status --short — только Sidebar.tsx.
- Живая проверка: создать вторую главу (у обеих будет Scene 1),
  выбрать Scene 1 в Главе 1 — подсвечивается только она, не Scene 1
  в Главе 2.
- Приложи изменённый файл целиком (или хотя бы изменённый фрагмент
  с достаточным контекстом).

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Приоритетная задача.
