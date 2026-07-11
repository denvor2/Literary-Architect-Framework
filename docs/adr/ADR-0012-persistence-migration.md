# ADR-0012: Persistence Migration — Dual-Mode localStorage/PostgreSQL

- **Status:** Accepted
- **Date:** 2026-07-11
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack Strategy —
  "Persistence: PostgreSQL, Prisma — Phase 2+"), `apps/studio/prisma/schema.prisma` (Sprint 23
  schema and its header comment)

## Context

Sprint 23 closed with a working PostgreSQL schema (`prisma migrate dev --name init`, applied and
live-verified against a real database — all 8 domain tables present). Sprint 24
(`docs/project/ROADMAP_18-27.md`, "Sprint 24 — Миграция localStorage → Database") is meant to
switch `Workspace` reads/writes from `localStorage` to that database, keeping `localStorage` as a
fallback.

The roadmap's draft plan for Sprint 24 (Step 01 repository layer → Step 02 dual-mode → Step 03
migration script → Step 04 `useWorkspaceController`) was written before any of the actual code was
read against it. Reading `apps/studio/src/storage/workspaceStorage.ts`,
`apps/studio/src/workspace/useWorkspaceController.ts`, `apps/studio/prisma/schema.prisma`, and
`apps/studio/src/lib/db.ts` surfaces six concrete decisions the roadmap's draft plan does not
answer, one of which (entity identifiers, Decision 4) is a blocking correctness bug the schema
would otherwise hit on the very first multi-book save. This ADR exists to fix all six decisions
before Sprint 24's implementation Step Cards (Step 02 onward) are executed, rather than guessing
them mid-implementation.

Two of the six decisions below (User Model, Dual-Mode Detection/Conflict Behavior) were genuine
product forks, not implementation details, and were confirmed explicitly by the Product Owner on
2026-07-10 before this ADR was written. They are recorded below as accepted decisions, not as
open questions awaiting a second round of review.

## Decision

### 1. User Model — Temporary Single-User Stopgap (confirmed by Product Owner, 2026-07-10)

The application today has no authentication and no notion of "current user" — not in
`useWorkspaceController.ts`, not in the UI. The Sprint 23 Prisma schema, however, requires a
non-null `Book.userId` (a mandatory relation to `User`).

**Decision for Sprint 24:** a single local user per instance, found-or-created automatically
("find the existing one or create one") on first repository access, with no login screen. This
matches ADR-0003's Phase 1 characterization ("single-user, local-first MVP") and requires no new
architectural surface.

This is explicitly a temporary stopgap, not the final design. The Product Owner has separately
confirmed a hard deadline: a full multi-user system with Admin/User roles must land **no later
than 5 sprints after Sprint 24** (i.e. no later than Sprint 29) — see
`docs/project/ROADMAP_18-27.md`'s Sprint 28 entry, added 2026-07-10 specifically so this
requirement is not lost. That future system is out of scope here; per evolutionary architecture,
this ADR does not design it now. It is named here only so that Sprint 24's single-user model is
unambiguously marked as a stopgap with an expiration, not a permanent architectural decision that
a future session might mistake for settled.

### 2. Persistence Split — Database vs. `localStorage`

`Workspace` (`domain/workspace.ts`) today mixes domain data (`books`) with ephemeral UI state
(`activeBookId`, `selectedChapterId`, `selectedSceneId`, `selectedCharacterId`,
`selectedAssistantMode`) — both are written to the same `localStorage` key by a single
`saveWorkspace()` call. `prisma/schema.prisma`'s header comment already states the intent:
"Workspace UI state ... is NOT persisted here — it is ephemeral."

**Decision:** ratify this as Sprint 24's persistence boundary. Only `books` moves to the database.
`localStorage` continues to hold the entire `Workspace` as it does today, ephemeral fields
included, unchanged. The database has no representation of `activeBookId` or any other UI-state
field, and none is added.

### 3. API Shape — Coarse (Whole-Tree) vs. Granular Per-Entity

The roadmap's draft plan names separate `bookRepository.ts`, `chapterRepository.ts`, etc., which
reads as an implicit suggestion for granular REST — a dedicated route per entity per operation.

**Decision:** a single coarse endpoint, `/api/workspace` (`GET`/`PUT` of the entire `books[]`
tree), mirroring the existing `loadWorkspace()`/`saveWorkspace()` contract. This is the smallest
new HTTP surface that satisfies Sprint 24's goal, consistent with this project's "smallest
validated step" discipline. The repository layer underneath may (and should) be organized
per-entity internally — that is an internal decomposition detail, not a constraint on the external
HTTP contract. Granular REST is deferred until a concrete reason exists (e.g. concurrent editing,
partial updates) — not designed speculatively now, per evolutionary architecture (ADR-0002).

### 4. Entity Identifiers — Blocking Technical Finding (not a choice)

`Chapter`/`Scene`/`Character`/`Idea`/`AssistantThread` ids are generated today as
`String(nextNumber)`, scoped locally within a single book/chapter/role
(`useWorkspaceController.ts`): the first chapter of *any* book gets id `"1"`; the first scene of
*any* chapter gets id `"1"`. The Sprint 23 Prisma schema requires a globally unique `@id` on each
of these tables (not a composite key with `bookId`). Without a fix, the first attempt to persist a
second book (or a second chapter) to the database fails on a primary-key conflict.

**Decision:** this is recorded here as context/precondition, not resolved by this ADR itself. The
fix (switching new-entity id generation to `crypto.randomUUID()`, natively available in the
browser, no new dependency) is scoped to a dedicated Step Card
(`Sprint-24-Step-02`) that runs before the repository layer (`Sprint-24-Step-03`) is built.
`Book.id` is out of scope for that fix — it is already effectively unique within a workspace
(there is no book-deletion function, the counter only grows) and is not part of the discovered
collision, which is between chapters/scenes of *different* books, not within one book's sequence.

### 5. Dual-Mode: Database Availability Detection and Conflict Behavior (confirmed by Product
   Owner, 2026-07-10)

**Decision:**

- Database availability is determined by the outcome of **every** read/write attempt, not just at
  session start — a session can stay open for hours, and the database can go down and recover
  within that window.
- A failed database write falls back to `localStorage` silently at the storage layer (no
  retry/backoff queue in this sprint — deferrable to Sprint 25 "Production hardening" if it turns
  out to be genuinely needed), **but the user must be explicitly warned** — a visible
  notification about the desync/database problem is required. This is a deliberate correction by
  the Product Owner to the original draft recommendation, which proposed a silent fallback; that
  silent-fallback framing is rejected. The exact notification form (toast/banner/status icon) is
  left to Sprint-24-Step-06 (the UI-wiring step) — it is a UI implementation detail, not an
  architectural decision fixed by this ADR.
- Desync between `localStorage` and the database is resolved with last-write-wins: the next
  successful database write overwrites the database with the current `books` in full — the same
  semantics already used for `localStorage` today. Known limitation: a conflict between two
  simultaneous tabs/devices loses the earlier edit — accepted as tolerable for single-user Phase
  1.
- **Database health visibility and the ability to take a backup** are confirmed as a real
  requirement. A basic backup mechanism (`pg_dump`-based script without UI) is scheduled for Sprint 27 
  (Product Owner decision, 2026-07-12), as a temporary measure to protect data in case live users 
  appear before the Admin UI is built (Sprint 30). The full Admin-UI health-visibility/restore 
  functionality remains scoped to the future Admin role, which does not exist before the future 
  multi-user sprint (see Decision 1).

### 6. Existing-Data Migration Mechanism

The roadmap draft's literal `scripts/migrate-localStorage-to-db.ts` (a Node CLI script) is not
implementable as a standalone script — `localStorage` only exists in a browser context, and the
project has no export/import function to bridge that gap; export/import formats are explicitly
recorded as out of scope (`docs/project/CURRENT_SPRINT.md`, "Out of Scope").

**Decision:** this is the only technically viable option given the project's current constraints,
not a choice among alternatives. Migration happens automatically in the browser on app load: if
the current user has no books in the database but does have books in `localStorage`, the client
performs a one-time push of those books to the database via `PUT /api/workspace`; from then on the
application operates in "database is the primary source" mode.

## Consequences

- The single-user stopgap (Decision 1) means `Book.userId` is always the same value for the
  lifetime of Sprint 24-29 — any code written against it must not assume multiple users exist, and
  must not be mistaken for a finished authorization model. The Sprint 30 deadline is the
  concrete forcing function that prevents this from silently becoming permanent.
- The coarse `/api/workspace` endpoint (Decision 3) means every `saveWorkspace()` call sends the
  entire `books[]` tree over the network, not just the changed entity — acceptable for a
  single-user, local-first MVP, but a real cost if the tree grows large or if genuine multi-device
  concurrent editing is ever required (tracked as a Review Trigger below).
- The id-generation fix (Decision 4) must land and be verified *before* the repository layer is
  built (`Sprint-24-Step-02` before `Sprint-24-Step-03`) — sequencing constraint, not a
  parallelizable pair of steps.
- Silent fallback + mandatory visible warning (Decision 5) is a deliberate compromise: it avoids
  building a retry/backoff queue this sprint while still not hiding data-integrity risk from the
  user, at the cost of the user occasionally seeing degraded-mode warnings during real database
  outages.
- Because `localStorage` remains the sole owner of ephemeral UI state (Decision 2) and continues
  to receive every `saveWorkspace()` call unconditionally, no existing Sprint 16-17/18 UI behavior
  (collapse state, selection, focus) changes due to this migration.

## Known Gaps

- No retry/backoff queue for failed database writes — a single missed write is silently retried
  only by the *next* organic edit, not proactively. Acceptable for Phase 1; explicitly deferred to
  Sprint 25 if real usage shows it matters.
- No granular conflict resolution across tabs/devices — last-write-wins can lose an earlier edit
  made in another tab. Accepted as a known Phase 1 limitation, not addressed here.
- Database health/backup visibility (Decision 5) splits into two parts. A basic backup mechanism
  (`pg_dump` script without UI) is scheduled for Sprint 27 (Product Owner decision, 2026-07-12). 
  The full Admin-UI health-visibility/restore functionality has no implementation surface until the 
  Admin role exists (Sprint 30) — until then, database health is only observable by an operator with 
  direct `psql`/`docker` access (or via the Sprint 27 backup script), not through the product.
- The one-time browser-side migration (Decision 6) has no explicit user-facing confirmation step —
  it runs transparently on first load. Acceptable for a single local user with no risk of
  ambiguity about which data set is authoritative (empty DB + non-empty `localStorage` has exactly
  one reasonable interpretation).

## Review Trigger

Revisit when:

- The Sprint 30 multi-user system lands — the single-user stopgap (Decision 1) and its
  `getOrCreateDefaultUser()` implementation must be replaced, not extended.
- The `books[]` tree grows large enough that the coarse `/api/workspace` PUT becomes a measurable
  performance problem (consider granular REST or partial updates at that point, not before).
- Real multi-tab/multi-device concurrent editing becomes a stated product requirement (last-write
  -wins would need to be revisited).
- A retry/backoff queue for failed database writes is found to be genuinely necessary in practice
  (tracked as Sprint 25 "Production hardening" candidate).
- Admin-role database health/backup functionality is scheduled (Sprint 30 or later) — that
  work should read this ADR's Decision 5 for the exact confirmed requirement before designing it.
  Note that a basic backup mechanism (without UI) is scheduled earlier, in Sprint 27.
