# Current Step

This file tracks the single active Step Card under the Task Bus execution model — see
[docs/task-bus/TASK_BUS_V4.md](../task-bus/TASK_BUS_V4.md) for the flow and
[docs/task-bus/STEP_CARD_TEMPLATE.yml](../task-bus/STEP_CARD_TEMPLATE.yml) for the schema.

Unlike `CURRENT_SPRINT.md` (updated only when a sprint closes), this file is updated on every
Step Card that closes via `REVIEW` `STATUS: OK` — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/` for why. It always reflects the last completed step, even mid-sprint.

```yaml
id: Sprint-25-Step-01/02/04
status: done
next: [Sprint-25-Step-03, Sprint-25-Step-05]
```

## Sprint 25 — UI/UX: структура интерфейса и настройка помощников (в процессе — 3 из 5 Step Card закрыты)

Три независимых Step Card закрыты одним коммитом реализации (`44c2d9a`) + отдельным коммитом
архивации в `done/` (`eb939d0`). Sprint 25 **не закрыт** — `Sprint-25-Step-03` (gear-настройки
помощников, по ADR-0013) и `Sprint-25-Step-05` (проход по единообразию дизайна через
`ui-specialist`) ещё в `docs/task-bus/queue/pending/`.

- **Step 01** — `AssistantPanel.tsx`: последний англоязычный заголовок `Assistants` →
  `Помощники`. `IdeasPanel` перенесён из `EditorArea`/`UnifiedBookView` в `Sidebar.tsx` (новая
  секция после "Персонажи", сам компонент `IdeasPanel.tsx` не тронут — только место рендера и
  источник пропов, переброшены через `apps/studio/src/app/page.tsx`). `Header.tsx` получил
  chrome-only вводную строку меню: `Файл`/`Правка`/`Вид` (каждая — disabled-заглушка "Скоро"),
  переключатель языка `RU` и `Войти` (оба `disabled`) — реализовано буквально как placeholder,
  без функциональности, по прямому двукратному подтверждению Product Owner. Прошёл полный
  review-конвейер: `architect-reviewer` изначально дал `STATUS: STOP` из-за неподтверждённой
  целостности реальной продакшн Postgres-БД после инцидента диагностики ARP (тестовые записи
  `"Тестовая книга light/dark"`, "восстановленные" вручную через `GET`+`PUT /api/workspace` без
  независимой сверки); независимая проверка `tester` (`Sprint-25-Step-01-TEST-REPORT.md`,
  `STATUS: PASS`) не обнаружила утечки тестовых данных в реальной БД и подтвердила её целостность
  побайтовым сравнением снимков до/после — на основании этого шаг закрыт.
- **Step 02** — `apps/studio/src/app/page.tsx`: перетаскиваемый делитель между `EditorArea` и
  `AssistantPanel` (не Focus Mode, `≥ lg`) через новую зависимость
  `react-resizable-panels@^4.12.1` (`Group`/`Panel`/`Separator`, `defaultSize="50"`,
  `minSize="20"` — строками, не числом, см. API-ловушку ниже), позиция не персистится. Мобильная
  раскладка (`< lg`) не тронута — решает собственный `useIsDesktopLayout()`
  (`matchMedia`, порог 1024px). `AssistantPanel.tsx`: 2-колоночная grid-карточка picker'а режимов
  заменена на ряд из 4 квадратных (40×40px) icon-кнопок без видимого текста, подпись — нативный
  `title`/`aria-label`; описание активного режима вынесено в общий абзац под рядом иконок.
  Найдена и обойдена API-ловушка библиотеки: числовые `defaultSize`/`minSize` — пиксели, не
  проценты, только строковые значения — проценты.
- **Step 04** — `book_field_suggestion` (`apps/studio/src/ai/operations.ts`) получил опциональное
  поле `requestType: "comparables" | "brainstorm" | "uniqueness"`, прокинутое в `aiBus.ts` и
  провалидированное в `apps/studio/src/app/api/book-field/route.ts`
  (`SUPPORTED_TITLE_REQUEST_TYPES` + отдельный промпт на тип, только для `fieldName === "title"`,
  остальные поля — без изменений). Единственная generic-кнопка "AI" у поля Title заменена на три
  типизированные pill-кнопки ("Подобрать аналоги"/"Мозговой штурм"/"Проверить на уникальность") в
  `EditorArea.tsx`, с собственным локальным состоянием компонента (вызывает `aiBus.execute()`
  напрямую, не через `page.tsx` — `page.tsx` вне Allowed paths карточки и параллельно
  редактировался Step 02). Карточка "Принять" скрыта для uniqueness (только "Понятно") — решение
  самой карточки, не новое. ADR-0011 амендирован ("Amendment (Sprint 25)", `Status: Accepted,
  revised Sprint 25`).
- **Next.** `Sprint-25-Step-03` (gear-настройки помощников по ADR-0013) и `Sprint-25-Step-05`
  (дизайн-проход через `ui-specialist`) — в `docs/task-bus/queue/pending/`, спринт остаётся
  открытым до их закрытия.

## Sprint 24 — Миграция localStorage → Database (closed)

- **Step 01** — ADR-0012 accepted: temporary single-user stopgap (hard deadline Sprint 28/29),
  dual-mode availability-per-call + last-write-wins + mandatory user-visible desync warning,
  `/api/workspace` coarse endpoint, entity-id collision flagged as blocking (Step 02), browser-
  side one-time migration mechanism.
- **Step 02** — `crypto.randomUUID()` replaces locally-scoped `String(nextNumber)` ids in
  `useWorkspaceController.ts`'s `createChapter`/`createScene`/`createCharacter`/`createIdea`/
  `createThread`/`acceptStructureProposal`, plus `createBook()` itself (found during review —
  not in the Step Card's original function list, but the most common path hitting the same
  collision). Live-verified via pure-reducer Node script (no browser, to avoid disturbing the
  Product Owner's active dev-server session).
- **Step 03** — `apps/studio/src/repositories/{userRepository,bookRepository,index}.ts`:
  server-only repository layer over the Prisma singleton — `getOrCreateDefaultUser()`,
  `loadBooksForUser(userId)`, `saveBooksForUser(userId, books)` (upsert+delete per entity in one
  `prisma.$transaction`). Handles persona null<->undefined mapping and AssistantThreads
  role-grouping. Live-verified against the real Postgres container: round-trip of a populated
  book, a second book with no id collisions, an edit+resave — confirmed via direct `psql`
  queries, not just the repository's own read path.
- **Step 04** — `apps/studio/src/app/api/workspace/route.ts`: thin GET/PUT wrapper over the
  repository layer (ADR-0012 Decision 3, coarse whole-tree contract). Live-verified with curl
  against a scratch-port (3417) production server, Product Owner's dev server on 3000 left
  untouched.
- **Step 05** — `workspaceStorage.ts`'s `loadWorkspace()`/`saveWorkspace()` become async and
  dual-mode: `localStorage` read first (sole owner of ephemeral UI state), database consulted on
  every call, silent fallback on failure, one-time browser-side migration when DB is empty but
  `localStorage` isn't.
- **Step 06** — `useWorkspaceController.ts`'s restore/persist effects adapted to the async
  signatures — this is what made Step 05's edit functional again (briefly broken by design
  until this step landed).
- **Step 07** (added mid-sprint, 2026-07-11) — fixed a real data-loss race Step 06's own live
  verification found: a non-empty database result won unconditionally over fresher
  `localStorage` edits made while the database was unreachable. Fixed with a storage-layer-only
  "unsynced changes pending" flag (separate `localStorage` key, not a domain field).
- **Step 08** (added mid-sprint, 2026-07-11) — closes a gap between ADR-0012 Decision 5
  (Product Owner required a visible warning on desync/DB-unavailable) and Step 06's card, which
  had mistakenly excluded any visual indicator. Adds `SyncWarningBanner.tsx` + a new
  `syncWarning` field on the hook's return value.
- **Sprint 24 closed.** Next: scope Sprint 25 (Environment + HTTPS + Production hardening).

## Sprint 23 — PostgreSQL + Prisma (closed)

All four steps implemented and validated, including Step 03 (`prisma migrate dev`), unblocked
2026-07-10 once Docker was confirmed installed on this machine.

- **Step 01** — `prisma/schema.prisma`: 8 models (User, Book, Chapter, Scene, Character, Idea,
  AssistantThread, ChatMessage) + 2 enums (AssistantRole, MessageRole). Cascade deletes,
  `@@index` on foreign keys, `order` fields for ordering.
- **Step 02** — `docker-compose.yml` updated with `postgres` service (postgres:16-alpine,
  healthcheck, named volume `pgdata`); `studio` service depends on healthy postgres.
- **Step 03** — `docker compose up -d postgres` (healthy), `npx prisma migrate dev --name init`
  from `apps/studio/` applied migration `20260710202615_init` against
  `postgresql://literary:literary@localhost:5432/literary_studio`. Verified live via
  `docker compose exec postgres psql -U literary -d literary_studio -c '\dt'` — all 8 domain
  tables plus `_prisma_migrations` present.
- **Step 04** — `src/lib/db.ts`: Prisma client singleton with `@prisma/adapter-pg` (Prisma 7.x
  driver adapter pattern), global caching for dev hot-reload safety.

Prisma client generated successfully. Packages installed: `prisma` (dev), `@prisma/client`,
`@prisma/adapter-pg`, `pg`, `@types/pg` (dev), `dotenv` (dev).

Validation: `tsc`, `eslint`, `build`, 12/12 Playwright E2E tests — all green.
