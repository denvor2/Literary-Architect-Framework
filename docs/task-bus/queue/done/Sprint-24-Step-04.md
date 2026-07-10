id: Sprint-24-Step-04
name: "/api/workspace — GET/PUT поверх repository-слоя"
type: implementation

## Контекст

По ADR-0012 (Sprint-24-Step-01): один "грубый" эндпоинт, зеркалирующий сегодняшний
loadWorkspace()/saveWorkspace(), а не гранулярный REST по сущностям. Тонкая HTTP-обёртка над
Sprint-24-Step-03's repository-слоем — тот же стиль, что у существующих /api/*/route.ts
(см. apps/studio/src/app/api/book-field/route.ts как образец: NextResponse.json,
{ ok: false, error } + статус-код, error instanceof Error ? error.message : "Unknown error").

## Scope

Allowed paths:
- apps/studio/src/app/api/workspace/route.ts (новый файл)

Forbidden paths:
- apps/studio/src/repositories/** (контракт зафиксирован Step 03, только использовать,
  не менять)
- apps/studio/src/workspace/**, apps/studio/src/storage/** (подключение — Step 05-06)
- любой UI-код

## Objective

GET /api/workspace -> { ok: true, books: Book[] } для дефолтного пользователя (через
getOrCreateDefaultUser() + loadBooksForUser() из Step 03). Пустая БД -> { ok: true, books: [] },
это не ошибка.

PUT /api/workspace, body { books: Book[] } -> валидация: books отсутствует или не массив ->
{ ok: false, error: "..." }, HTTP 400 (тот же паттерн, что у остальных route.ts). При успехе ->
saveBooksForUser(), ответ { ok: true }.

Runtime-исключение (например, БД реально недоступна) -> { ok: false, error: string },
HTTP 500 — та же обработка, что и в остальных route.ts. Это и есть сигнал "БД недоступна" для
dual-mode логики Sprint-24-Step-05 — отдельный health-check эндпоинт не нужен.

## Rules

- Discovery-реализация, без авторизации/сессий (single default user, по ADR-0012), без
  rate-limiting сверх того, что уже есть в проекте (то есть ничего).
- Не менять repository-слой ради удобства этого шага — если контракт Step 03 неудобен,
  зафиксировать это в ARP как находку, не переписывать его тут явочным порядком.

## Validation

- npx tsc --noEmit, npm run lint, npx prettier --check, npm run build — чисто.
- Живая проверка curl против реального сервера + реальной БД (docker compose up postgres,
  npm run dev в apps/studio):
  1. GET на пустой БД -> { ok: true, books: [] }.
  2. PUT с реалистичным деревом (1-2 книги, главы, сцены, ideas, assistantThreads) ->
     { ok: true }.
  3. Повторный GET -> возвращает ровно то, что было записано в п.2 (сверить содержимое, не
     просто код ответа).
  4. PUT без books в теле -> 400 с понятным сообщением об ошибке.
- Приложить реальные curl-выводы (не описание "должно работать") в ARP.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
