id: Sprint-11-Step-05
name: "ADR-0007: мультикнижность (Workspace.books[]) + закрытие Sprint 11"
type: implementation

## Scope

Allowed paths:
- docs/adr/ADR-0007-multi-book-workspace.md (новый файл)
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/project/PROJECT_STATE.md

Forbidden paths:
- любой код (apps/studio/**)

## Objective

В отличие от Sprint 10 (чистый CRUD, без ADR), Sprint 11 меняет
фундаментальную структуру Workspace — это архитектурное решение,
заслуживающее ADR, по тому же методу, что ADR-0004/0005/0006 (из
уже реализованного кода, построчные ссылки, не абстрактное
проектирование).

### ADR-0007-multi-book-workspace.md

Из кода Sprint-11-Step-01..04 + двух экстренных фиксов:

- **Context**: до этого Sprint — Workspace держал ровно одну книгу
  (`book: Book | null`, chapters/characters на верхнем уровне
  Workspace). `createBook()` полностью замещал существующую книгу —
  риск потери данных (реально произошедший инцидент: Product Owner
  потерял первую книгу при создании второй, до этого Sprint).
- **Decision**: `Workspace` теперь `{ books: Book[], activeBookId,
  selectedChapterId, selectedSceneId, selectedCharacterId }`. `Book`
  стал самодостаточным контейнером — включает свои `chapters` и
  `characters` (раньше были отдельными полями Workspace). Selection-
  поля остаются на уровне Workspace, не внутри Book — сознательное
  упрощение: переключение книги сбрасывает выбор главы/сцены/
  персонажа (не сохраняется per-book).
- **Миграция данных**: `migrateIfNeeded()` в `workspaceStorage.ts`
  распознаёт старый формат (наличие `book` на верхнем уровне
  распарсенных данных) и оборачивает в один `Book` с `id: "1"`.
  Обязательно зафиксировать как явный факт: **первая книга Product
  Owner была потеряна до появления этой миграции** — миграция
  защищает данные, сохранённые после её появления, не восстанавливает
  то, что уже было потеряно раньше.
- **normalizeBook()**: отдельный, важный архитектурный паттерн,
  родившийся из трёх повторяющихся инцидентов (characters на
  Workspace, Chapter.subtitle, Book.tags/аннотации) — каждое новое
  поле сущности рискует остаться `undefined` на уже сохранённых
  старых данных. `normalizeBook()` централизует дефолты для каждого
  поля `Book` в одном месте. Зафиксировать как **обязательную
  практику на будущее**: при добавлении нового поля в `Book`
  (и, по аналогии, вероятно — в `Chapter`/`Character`/`Scene`),
  `normalizeBook()` (или аналог) должен обновляться в том же Step
  Card, не откладываться на "потом, когда где-то упадёт".
- **selectBook() naming collision**: явно описать как урок процесса
  — переиспользование существующего имени функции под новую
  сигнатуру/смысл потеряло функциональность (Sprint 10's "вернуться
  к обзору книги") до явного обнаружения и восстановления как
  `deselectAll()`. Зафиксировать как процессный урок: Architect
  должен явно проверять существующие функции/имена перед тем, как
  предписывать новую функцию с тем же именем.
- **Review Triggers**: по аналогии с предыдущими ADR — что должно
  вызвать пересмотр (например, если selection-состояние понадобится
  сохранять per-book, а не сбрасывать при переключении).

### Закрытие Sprint 11

CURRENT_SPRINT.md — все 5 шагов (+ 2 экстренных фикса) [x], статус:
Closed. Честное summary фактического объёма, как в закрытии Sprint 10
(перечисли реальные коммиты). Явно укажи Out of Scope: серии книг
(отдельная будущая идея, уже в vision-документе), сворачиваемые
уровни отображения (тоже в vision-документе, не решение).

CURRENT_STEP.md — id: Sprint-11-Step-05, status: done, next: [].

PROJECT_STATE.md — Sprint 11: Closed, ADR-таблица (ADR-0007: Accepted),
Known Risks — обновить/снять пункт про риск потери данных при
создании книги (теперь решён), Domain Model — Book теперь
самодостаточный контейнер.

## Rules

- Только документация, никакого кода.
- Метод ADR-0004/0005/0006 — из кода, не абстрактно.
- Явно зафиксировать факт потери первой книги — не скрывать и не
  смягчать формулировку.

## Validation

- grep -n "ADR-0007" docs/project/PROJECT_STATE.md
- grep -n "normalizeBook" docs/adr/ADR-0007-multi-book-workspace.md
- git status --short — только перечисленные в Scope файлы.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
