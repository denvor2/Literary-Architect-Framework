id: Sprint-14-Step-01-ARP
name: "ARP: персонажи Reader + мутации тредов — 'проводка'"
type: arp

## Что сделано

- **`domain/model.ts`** — `AssistantThread` получил опциональное поле `persona?: string`.
  Осмысленно только для Reader; остальные три роли его не используют. Миграция в
  `workspaceStorage.ts` не нужна — поле опционально, старые сохранённые треды просто не имеют
  его (не трогал этот файл, как и требовал Forbidden paths).
- **`app/api/reader/route.ts`** — принимает опциональный `persona` из тела запроса. При наличии
  — добавляет инструкцию в начало system prompt (`You are reading and reacting as: ${persona}.
  Stay in this persona throughout.\n\n` + существующий текст). Без `persona` — поведение
  побайтово то же, что раньше (подтверждено живой проверкой, см. ниже).
- **`ai/operations.ts`** — `reader_reaction` payload получил опциональный `persona?: string`.
- **`ai/aiBus.ts`** — ветка `reader_reaction` прокидывает `persona` в тело запроса, если задан
  (тот же паттерн, что уже используется для `bookContext` в `improve_text`).
- **`workspace/useWorkspaceController.ts`**:
  - `appendMessage(mode, message, threadId?)` — обобщена на конкретный тред по id; без
    `threadId` — прежнее поведение (последний тред), Co-author/Editor/Critic не затронуты.
  - `createThread(mode, options?: { name?: string; persona?: string })` — расширена
    (не новая функция), без `options` — прежнее поведение (автоимя "Диалог N").
  - `renameThread(mode, threadId, name)` — новая мутация.
  - `deleteThread(mode, threadId)` — новая мутация, no-op при попытке удалить последний
    оставшийся тред роли.
  - Все четыре — в возвращаемом объекте хука.

## Соответствие Scope

Изменены ровно 5 файлов из Allowed paths (`git status --short` подтверждает). UI
(`components/**`, `page.tsx`) и `storage/**` не тронуты.

## Validation

- **`npx tsc --noEmit`** — 0 ошибок.
- **`npx eslint`** (5 файлов) — 0 ошибок, 0 предупреждений.
- **`npx prettier --check`** — чисто (после `--write` для `useWorkspaceController.ts`).
- **`npm run build`** — успешно, все роуты собраны.
- **Живая проверка, часть 1 (pure-reducer, без сети)** —
  `scratchpad/verify-sprint14-step01-logic.mjs`, тела функций скопированы дословно: 14/14
  сценариев PASS — `appendMessage` с/без `threadId` (адресация конкретному треду vs последнему,
  остальные треды не трогаются), `createThread` с/без `options` (автоимя vs заданное имя+
  persona), `renameThread` (точечное переименование), `deleteThread` (удаление конкретного
  треда + отказ удалить последний оставшийся тред роли, проверено на `coauthor`).
- **Живая проверка, часть 2 (реальный сервер + реальный вызов Claude)** — `npx next start` на
  порту 3418, `scratchpad/verify-sprint14-step01-live.mjs` бьёт по `/api/reader`: без `persona`
  — 200 OK, обычный нейтральный тон "вовлечённого читателя"; с `persona: "десятилетний
  ребёнок..."` — реально детский, восторженный тон ("Ну вот, прочитала я это и сразу как будто
  сама на крыльце стою!"); с `persona: "суровый литературный критик..."` — реально другой,
  саркастичный опытный тон ("Сорок лет читаю — и глаз сразу цепляется... Классическая
  увертюра, тысячу раз видел"). Persona не просто принимается сервером, а реально меняет
  поведение модели — не просто 200 OK для галочки. 3/3 PASS. Сервер остановлен после проверки.

## Отклонения от Step Card

Нет.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (работаем без отдельной сессии Architect).
