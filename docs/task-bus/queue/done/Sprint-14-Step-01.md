id: Sprint-14-Step-01
name: "Домен + backend + AI Bus + контроллер: персонажи Reader, мутации тредов ('проводка')"
type: implementation

## Примечание о процессе

Ставлю себе сам (Programmer/Executor) — работаем без отдельного Architect, Product Owner
ревьюит напрямую. Развилки по дизайну (персонажи настоящие, нужны и вкладки, и сравнение бок о
бок) уже разрешены Product Owner в ходе планирования (Plan Mode) — см.
`docs/project/CURRENT_SPRINT.md` для полного контекста Sprint 14.

## Scope

Allowed paths:
- `apps/studio/src/domain/model.ts`
- `apps/studio/src/app/api/reader/route.ts`
- `apps/studio/src/ai/operations.ts`
- `apps/studio/src/ai/aiBus.ts`
- `apps/studio/src/workspace/useWorkspaceController.ts`

Forbidden paths:
- `apps/studio/src/components/**` (UI — Step 02, не сейчас)
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/storage/**` (новое поле опционально, миграция не нужна — не трогать)
- `apps/studio/src/app/api/line-editor/**`, `apps/studio/src/app/api/critic/**`,
  `apps/studio/src/app/api/coauthor/**` — только `/api/reader` меняется в этом шаге.

## Objective

"Проводка" для именованных экземпляров Reader с персонажами: домен-тип, backend, AI Bus,
контроллер — без UI (Step 02).

## Что сделать

### 1. `domain/model.ts`

```ts
export type AssistantThread = {
  readonly id: string;
  readonly name: string;
  readonly messages: readonly ChatMessage[];
  readonly persona?: string;
};
```

Одно новое опциональное поле. Осмысленно только для Reader; остальные роли его не используют.
Не требует изменений в `storage/workspaceStorage.ts` — поле опционально, старые сохранённые
треды просто не имеют его.

### 2. `app/api/reader/route.ts`

Принять опциональный `persona` из тела запроса (`body?.persona`, `typeof === "string"`, иначе
просто не использовать — не 400, поле не обязательно). При наличии — добавить инструкцию в
начало существующего system prompt:

```
`You are reading and reacting as: ${persona}. Stay in this persona throughout.\n\n` + существующий текст
```

Без `persona` — поведение побайтово то же, что сейчас (тот же принцип, что `bookContext` в
Line Editor, Sprint 12 Step 02).

### 3. `ai/operations.ts`

`reader_reaction` payload получает опциональный `persona?: string`.

### 4. `ai/aiBus.ts`

В ветке `reader_reaction` — прокинуть `persona` в тело запроса к `/api/reader`, если задан
(аналогично тому, как `bookContext` прокидывается для `improve_text`/`coauthor_draft`).

### 5. `workspace/useWorkspaceController.ts`

- **`createThread(mode, options?: { name?: string; persona?: string })`** — расширить уже
  существующую функцию (не новая функция). Без `options` — прежнее поведение (автоимя
  "Диалог N"). С `options.name` — использовать его вместо автоимени. `options.persona` —
  записать в новый тред.
- **`renameThread(mode, threadId, name)`** — новая мутация, immutable-паттерн как везде
  (найти `activeBook`, `.map` по нужному треду, no-op если книги/треда нет).
- **`deleteThread(mode, threadId)`** — новая мутация. No-op, если это последний оставшийся
  тред роли (инвариант "у каждой роли всегда ≥1 тред" не нарушать).
- **`appendMessage(mode, message, threadId?)`** — обобщить на конкретный тред по id; без
  `threadId` — прежнее поведение (последний тред), для Co-author/Editor/Critic ничего не
  меняется.

Никакого нового состояния выбора/сравнения в `Workspace`/`Book` — это будет чисто UI-состояние
в Step 02, не персистится.

## Rules

- Immutable-паттерны — как везде в контроллере.
- Не трогать `activeThreads` (derived-значение из Step 04) — остаётся как есть, используется
  Co-author/Editor/Critic без изменений.
- Не добавлять ничего сверх перечисленного (без UI, без миграций).

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npx prettier --check` — чисто.
- Живая проверка:
  1. Pure-reducer скрипт (та же техника, что Sprint-13-Step-04) для `createThread` (с/без
     `options`), `renameThread`, `deleteThread` (включая отказ удалить последний тред),
     `appendMessage` (с явным `threadId` и без него).
  2. Реальный вызов `/api/reader` против `next start` с полем `persona` — подтвердить, что
     ответ реально отражает персонажа (не просто 200 OK).
- `git status --short` — только файлы из Allowed paths.

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
