# Current Step

This file tracks the single active Step Card under the Task Bus execution model — see
[docs/task-bus/TASK_BUS_V4.md](../task-bus/TASK_BUS_V4.md) for the flow and
[docs/task-bus/STEP_CARD_TEMPLATE.yml](../task-bus/STEP_CARD_TEMPLATE.yml) for the schema.

Unlike `CURRENT_SPRINT.md` (updated only when a sprint closes), this file is updated on every
Step Card that closes via `REVIEW` `STATUS: OK` — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/` for why. It always reflects the last completed step, even mid-sprint.

```yaml
id: Sprint-24-Step-08
status: done
next: []
```

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
