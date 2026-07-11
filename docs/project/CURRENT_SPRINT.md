# Current Sprint

**Sprint 24 — Миграция localStorage → Database (see ROADMAP_18-27.md)** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** Closed — all eight Step Cards completed (six originally scoped + two added
  mid-sprint by Product Owner decision, 2026-07-11, after live verification surfaced a real gap).
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/project/ROADMAP_18-27.md` (Sprint 24 row, Definition of Done fully
  checked).

## Sprint 24 — closed

Миграция localStorage → Database — `Workspace.books` moves to PostgreSQL (via Sprint 23's
Prisma schema), `localStorage` remains a fallback and the sole owner of ephemeral UI state
(ADR-0012 Decision 2). ADR-0012 accepted, ratifying six architectural decisions (temporary
single-user stopgap with a hard Sprint 28/29 deadline; dual-mode availability-per-call +
last-write-wins + mandatory user-visible desync warning; coarse `/api/workspace` endpoint;
entity-id collision fix; browser-side one-time migration).

- **Step 01** — ADR-0012 accepted (`docs/adr/ADR-0012-persistence-migration.md`).
- **Step 02** — `crypto.randomUUID()` replaces locally-scoped `String(nextNumber)` ids across
  all entity-creating functions in `useWorkspaceController.ts`, including `createBook()` itself
  (found during review, not in the card's original function list — the most common path hitting
  the same collision).
- **Step 03** — `apps/studio/src/repositories/{userRepository,bookRepository,index}.ts`:
  server-only Prisma repository layer (`getOrCreateDefaultUser`/`loadBooksForUser`/
  `saveBooksForUser`), live-verified against the real database via direct `psql` queries.
- **Step 04** — `/api/workspace` (GET/PUT), thin HTTP wrapper over Step 03, live-verified with
  curl against a scratch-port server.
- **Step 05** — `workspaceStorage.ts`'s `loadWorkspace()`/`saveWorkspace()` become async and
  dual-mode.
- **Step 06** — `useWorkspaceController.ts` adapted to the async storage contract.
- **Step 07** (added mid-sprint) — fixed a real data-loss race Step 06's own live verification
  found: a non-empty database result previously won unconditionally over `localStorage`, silently
  discarding edits made while the database was unreachable if the page reloaded after recovery
  but before the next successful save. Fixed with a storage-layer-only "unsynced changes
  pending" flag.
- **Step 08** (added mid-sprint) — closes a gap between ADR-0012 Decision 5 (Product Owner
  required a visible warning on desync/DB-unavailable, correcting an earlier silent-fallback
  draft) and Step 06's card, which had mistakenly excluded any visual indicator. Adds
  `SyncWarningBanner.tsx` and a new `syncWarning` field on the workspace-controller hook.

All eight steps live-verified against a real, isolated Postgres database (never the Product
Owner's actual data) and, from Step 06 onward, against the Product Owner's actual active
`localhost:3000` dev-server session without disrupting it. Committed `d7ccaa6`, `182b88d`,
`fd0282e`, `2a162cf`, `8c2bf7d`, plus archival commits.

## Sprint 15 — closed

Delivered both of Sprint 15's Goal items: Russian-language instructions for Line Editor/Critic
(previously English-only, unlike Reader/Co-author which already had this since Sprint 09/12), and
an audit-and-translate pass over the remaining English UI copy.

- **Step 01** — Line Editor/Co-author follow responses to `bookContext.language` (not hardcoded
  Russian); Critic/Reader gained an optional `bookLanguage` request field, defaulting to Russian.
  Live-verified against a real server across three languages (English, Ukrainian, Russian
  default). Committed `fccaf41`.
- **Step 02** — audited and translated remaining English UI copy across `AssistantPanel.tsx`,
  `EditorArea.tsx`, `NewBookDialog.tsx`, `CharacterPanel.tsx`, `Sidebar.tsx`, `Header.tsx`,
  `DeveloperTools.tsx`, `LineEditorPanel.tsx`, `TestConnectionButton.tsx`, `layout.tsx`'s `lang`
  attribute — with recorded, deliberate exceptions (domain enum values, product name/tagline).
  Committed `8eeb724`.
- **Cleanup (2026-07-10, folded in after Step 02's archive)** — one English string in
  `ReaderPanel` missed by Step 02's inventory, translated; `ADR-0004` backfilled with the Step 01
  language-following revision that had been implemented but never folded into the ADR. Committed
  `c32b6ff`.

## Sprint 16-17 — closed

Unified book view with collapsible navigation tree — committed `62ed860`. The three-screen
split (book overview / chapter overview / single-scene editor) was replaced by a single
continuous, scrollable `UnifiedBookView` with collapse/expand at every level. Sidebar tree
clicks now scroll instead of switching screens.

- **Step 01** — book requisites block made collapsible on the book-overview screen.
- **Step 02** — three-screen split removed; `UnifiedBookView` renders every chapter with its
  scenes' text inline; sidebar tree clicks became scroll-to; `focusedSceneKey` replaced fixed
  `textareaRef` for assistant panel context.
- **Step 03** — collapse/expand at every level: whole-book, per-chapter, per-scene, and
  per-chapter bulk toggle.

**E2E testing added post-close:** Playwright smoke tests (`apps/studio/e2e/smoke.spec.ts`)
cover app load, book/chapter/scene CRUD, text editing, sidebar tree, chapter/scene collapse,
Focus Mode, and localStorage persistence — 12 tests, all green. Committed `2a28fa6`.

## Sprint 18 — closed

Ideas/Notes — free-form notes per book with auto-timestamped creation. Committed together
with Sprint 18 steps.

- **Step 01** — `Idea` type (`id`/`text`/`createdAt`) added to domain model; `ideas: Idea[]`
  added to `Book`; `normalizeBook()` defaults `ideas: []` for old books.
- **Step 02** — `IdeasPanel.tsx` component with inline text editing and delete confirmation;
  CRUD operations (`createIdea`/`updateIdea`/`deleteIdea`) in workspace controller.
- **Step 03** — IdeasPanel integrated into `UnifiedBookView` after chapters section.

## Sprint 19 — closed

Critic subcategories — four thematic lenses for focused literary feedback.

- **Step 01** — ADR-0009 accepted: continuity/fact/developmental/style lenses, optional
  `subcategory` in request body, system prompt suffix, backward compatible.
- **Step 02** — `/api/critic` accepts `subcategory`; `CRITIC_SUBCATEGORY_PROMPTS` map;
  base prompt extracted to constant.
- **Step 03** — `critic_review` operation gains `subcategory`; `aiBus.execute()` forwards.
- **Step 04** — Pill-button selector in AssistantPanel Critic mode (Все/Связность/
  Достоверность/Развитие/Стиль); ephemeral state, does not reset thread.

## Sprint 20 — closed

Co-author structure proposal — Co-author suggests book structure (chapters/scenes with
titles and descriptions), user accepts via checkboxes.

- **Step 01** — ADR-0010 accepted: `StructureProposal` schema, `mode: "structure"` in
  `/api/coauthor`, `coauthor_propose_structure` operation type.
- **Step 02** — `/api/coauthor` extended with `mode`; `STRUCTURE_SYSTEM_PROMPT`; response
  `{ ok: true, proposal }` for structure mode.
- **Step 03** — `coauthor_propose_structure` in `operations.ts` and `aiBus.ts`; AssistantPanel
  UI: "Предложить структуру" button, tree with checkboxes, acceptance buttons.
- **Step 04** — `acceptStructureProposal()` in workspace controller; wired through page.tsx.

## Sprint 21 — closed

Book Field AI Suggestions — AI helps with Book metadata fields (title, genre, premise,
annotations) with suggestions and explanations.

- **Step 01** — ADR-0011 accepted: `BookFieldName` union type, `book_field_suggestion`
  operation, `/api/book-field` endpoint, `{ suggestion, explanation }` response.
- **Step 02** — `/api/book-field` route with field-aware system prompts, JSON parsing.
- **Step 03** — `book_field_suggestion` in `operations.ts` and `aiBus.ts`.
- **Step 04** — AI buttons next to Book fields in requisites, suggestion card with
  accept/reject, state management in page.tsx.

## Sprint 22 — closed

Docker + basic infrastructure — containerization for local development and deployment.

- **Step 01** — `Dockerfile`: multi-stage build (node:20-alpine, builder + runner), standalone
  output in `next.config.ts`, non-root user.
- **Step 02** — `docker-compose.yml`: `studio` service with build context, port 3000,
  env_file, restart policy.
- **Step 03** — `.dockerignore`: excludes node_modules, .next, .git, docs, e2e, etc.
- **Step 04** — Docker build requires Docker installed (not available on this machine);
  validated: `tsc`, `eslint`, `build`, 12/12 E2E tests all green.

## Sprint 23 — closed

PostgreSQL + Prisma — database schema matching domain model, Prisma client singleton.

- **Step 01** — `prisma/schema.prisma`: 8 models (User, Book, Chapter, Scene, Character, Idea,
  AssistantThread, ChatMessage) + 2 enums. Cascade deletes, indexes.
- **Step 02** — `docker-compose.yml` updated with postgres service (healthcheck, named volume).
- **Step 03** — `prisma migrate dev --name init` applied against a running `postgres:16-alpine`
  container; verified live via `psql \dt` (all 8 domain tables + `_prisma_migrations` present).
  Unblocked 2026-07-10 (Docker confirmed installed).
- **Step 04** — `src/lib/db.ts`: Prisma client singleton with `@prisma/adapter-pg`.

## Out of Scope (held constant this sprint)

- Everything already recorded as out of scope in prior sprints (Book Series, Trash/Archive,
  ЛитРес genre-list integration, export/import formats, AI provider/model selection, Critic's
  thematic subcategories) — see `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Sections 1, 7, 8, 9,
  11, 12, 14.
- Full product-wide localization (Sprint 30-40, renumbered from 32-42 after the 2026-07-10 roadmap
  insertions) — Sprint 15 already covered this project's narrower localization scope.
- A dedicated ADR for the unified view — per evolutionary architecture, considered only after this
  lands and is confirmed working, not designed upfront (see ADR-0002).

## Known Open Items (carried forward)

- Book Series remains a vision-only idea — not designed, not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`.
- This project is currently working without a separate Architect session — the Product Owner
  reviews directly (see `docs/project/HANDOVER.md`).


## Next Action

Sprint 25 scoped 2026-07-11: "UI/UX: структура интерфейса и настройка помощников" - see
docs/project/ROADMAP_18-27.md's Sprint 25 entry and the five Step Cards in
docs/task-bus/queue/pending/ (Sprint-25-Step-01 through Step-05). This is a Product Owner
insertion ahead of the previously-planned "Sprint 25 (Environment + HTTPS + Production
hardening)", which has shifted to Sprint 26 - all subsequent sprints through the previously
fixed Sprint 28 (multi-user) shifted by +1 as well; multi-user is now Sprint 29, exactly at its
previously-fixed hard deadline ("не позже 5 спринтов от Sprint 24") with no slack remaining -
see ROADMAP_18-27.md's renumbering note for the full accounting.

Sprint 25 Step 03 (per-assistant "gear" settings) requires ADR-0013 to be drafted and, more
importantly, requires a direct Product Owner decision on several open forks before it can be
marked Accepted - including a newly-surfaced overlap with Sprint 29's already-fixed Admin
requirement for editable AI Expert system prompts. Do not let step-executor start Sprint 25
Step 03 as a plain implementation task; it is scoped as an architecture-type Step Card for
exactly this reason. Sprint 25 Step 02 (assistant-mode picker reorganization) also has an open
UX fork (tabs vs. icon-strip vs. other) flagged for direct Product Owner confirmation before
that part of the step proceeds - see the Step Card itself.
