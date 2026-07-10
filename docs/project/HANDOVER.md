# Handover

Read this first if you are a new session (human or AI) joining this project cold. It is meant
to make the rest of the repository make sense without re-reading the whole history.

## First Five Minutes

Read, in this order: this file, then
[PROJECT_STATE.md](PROJECT_STATE.md), then
[CURRENT_SPRINT.md](CURRENT_SPRINT.md), then the Accepted ADRs (`docs/adr/`). That's enough
context to pick up the work. If any term here is unfamiliar, see [GLOSSARY.md](GLOSSARY.md).

## Project

**Literary Studio** — an AI-powered IDE for writers, not a chat-based writing tool. Writers
work with a team of specialist AI Experts (Professional Roles) that operate directly on a
manuscript. Fiction is the first domain; the architecture is meant to generalize to
screenplays, non-fiction, articles, and technical documentation. Full context:
[README.md](../../README.md), [PROJECT_CHARTER.md](PROJECT_CHARTER.md).

## Current Sprint

Sprint 16-17 (unified book view with collapsible navigation tree) is closed — committed
`62ed860`. The three-screen split (book overview / chapter overview / single-scene editor) has
been replaced by a single continuous, scrollable `UnifiedBookView` with collapse/expand at every
level, and sidebar tree clicks now scroll instead of switching screens. Sprints 06 through 17
are all closed. See [CURRENT_SPRINT.md](CURRENT_SPRINT.md) for the next sprint goal.

**Process note:** this project is currently working without a separate Architect session — the
Product Owner reviews Step Cards directly instead (see "Architecture Review before commit"
below).

## Architecture

- Repository is an ecosystem monorepo, not just an app: `apps/` (delivery applications) sits
  alongside `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract, originally left deliberately undesigned (evolutionary architecture — see
  the now-superseded [ADR-0002](../adr/ADR-0002-expert-contract-vision.md)), was discovered from
  the Line Editor implementation and ratified as
  [ADR-0004](../adr/ADR-0004-expert-contract-specification.md), then reused for three more
  Experts: [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) (Critic),
  [ADR-0006](../adr/ADR-0006-reader-expert-contract.md) (Reader), and
  [ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md) (Co-author). All four Product Roles
  now have a ratified Expert contract — this is no longer an open architectural question.
- The technology stack (below) is fixed by
  [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) — check it before adding any new
  framework, SDK, or runtime dependency.

## Current Status

- `apps/studio/` is a working Literary Studio MVP: multi-book Workspace (`books: Book[]` +
  `activeBookId`, Sprint 11), Book → Chapter → Scene structure, Characters, a unified scrollable
  book editor with collapse/expand at every level (Sprint 16-17, replacing the old three-screen
  book/chapter/scene split), Focus Mode, and `localStorage` persistence — layered on a
  domain-driven architecture (Sprint 06) with four live AI Experts.
- **AI Experts (all live-validated with real Claude responses):** Line Editor (`/api/line-editor`,
  Sprint 04), Critic (`/api/critic`, Sprint 08), Reader (`/api/reader`, Sprint 09, gained an
  optional `persona` field Sprint 14), Co-author (`/api/coauthor`, Sprint 12 — the first
  genuinely generative Expert, receiving the whole `Book` as context). All four Product Roles
  now map 1:1 to their own Expert. As of Sprint 13, all four routes accept a client-managed
  `messages` history array — the server remains stateless (ADR-0004); nothing is persisted
  between calls.
- **Architecture:**
  `UI (page.tsx, orchestration only) → Workspace Controller (useWorkspaceController) →
  Workspace (domain/workspace.ts) → AI Bus (aiBus.execute, dispatches by operation.type) →
  Operation → Context Envelope → Response → Applied Response → /api/line-editor | /api/critic |
  /api/reader | /api/coauthor`.
  - `apps/studio/src/domain/` — single source of truth for
    `Book`/`Chapter`/`Scene`/`Character`/`Workspace`. `Book` also holds `assistantThreads`
    (Sprint 13) — one or more named dialogs per Product Role (Co-author/Editor: always one
    continuous thread; Critic: may hold several, but the UI still only shows the last/active
    one; Reader (Sprint 14): surfaces all of them as named, comparable instances, each
    optionally carrying a `persona` — `AssistantThread`'s one new optional field).
  - `apps/studio/src/ai/` — AI Bus v5 contracts (`operations.ts`, `context.ts`, `response.ts`,
    `applier.ts`, `aiBus.ts`). Since Sprint 13, `AIOperation` payloads use `sceneText` (not
    `text`/`currentText`) plus a required `messages` array, uniformly across all four variants.
  - `apps/studio/src/storage/workspaceStorage.ts` — the only place that touches `localStorage`;
    also holds `migrateIfNeeded()` (old single-book format) and `normalizeBook()` (centralized
    field-defaulting for `Book`).
  - `apps/studio/src/workspace/useWorkspaceController.ts` — owns all `Workspace` state and
    mutation logic, including `appendMessage`/`createThread`/`activeThreads` for
    `assistantThreads` (Sprint 13).
  - `apps/studio/src/components/AssistantPanel.tsx` — the single functional AI-interaction
    surface (mode cards + real chat history + input, responsive `lg:` layout), since Sprint 13
    Step 05. `EditorArea.tsx` went back to pure scene editing the same step — it no longer
    contains any AI-calling code. Reader's mode (Sprint 14) has its own sub-UI (`ReaderPanel`)
    — named instance chips (create/rename/delete), single-view switching, and a side-by-side
    compare grid for 2+ selected instances; Co-author/Editor/Critic are unaffected.
  - `apps/studio/src/components/EditorArea.tsx` — as of Sprint 16-17, a single continuous,
    scrollable `UnifiedBookView` (book requisites, then every chapter with its scenes' text
    inline and editable) replaces the old three mutually exclusive screens (book overview /
    chapter overview / single-scene editor). `Sidebar.tsx`'s tree clicks scroll to the
    corresponding block (`chapter-block-{id}`/`scene-block-{id}` element ids) instead of
    switching screens; `selectedChapterId`/`selectedSceneId` (still persisted in `Workspace`)
    now only restore scroll position and drive the tree highlight, not "which screen to render".
    `page.tsx`'s `focusedSceneKey` (the scene whose `<textarea>` was last focused) is what
    `AssistantPanel` treats as the current scene, falling back to the persisted selection right
    after load. Collapse/expand state (whole-book, per-chapter, per-scene, and a per-chapter
    "collapse all its scenes" bulk toggle) is ephemeral, lifted to `page.tsx`, shared between
    `EditorArea.tsx` and `Sidebar.tsx`'s matching tree indicators — not part of `Workspace`.
- `apps/studio/src/components/LineEditorPanel.tsx` no longer bypasses the AI Bus — routed through
  `aiBus.execute()` since Sprint 07 Step 02. The previously tracked "known gap" here is closed.
- `framework/`, `prompts/`, `templates/`, `examples/`, `tests/`, `assets/` are still empty
  scaffolding from Sprint 01.
- Documentation (this file included) was substantially expanded in Sprint 03 via an
  Architecture Review process, updated at Sprint 06 closeout, and refreshed several times since
  as drift was found (most recently at Sprint 16-17 close).
- **E2E testing:** Playwright smoke tests (`apps/studio/e2e/smoke.spec.ts`) cover app load,
  book/chapter/scene CRUD, text editing, sidebar tree navigation, chapter and scene
  collapse/expand, Focus Mode toggle, and localStorage persistence. Run `npm run test:e2e` from
  `apps/studio/`; `test:e2e:ui` for headed mode, `test:e2e:debug` for step-through.

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Superseded by ADR-0004 |
| [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) | Technology Stack Strategy | Accepted |
| [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) | Expert Contract Specification | Accepted, revised Sprint 12 |
| [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) | Critic Expert Contract | Accepted |
| [ADR-0006](../adr/ADR-0006-reader-expert-contract.md) | Reader Expert Contract | Accepted, revised Sprint 14 |
| [ADR-0007](../adr/ADR-0007-multi-book-workspace.md) | Multi-Book Workspace | Accepted |
| [ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md) | Co-author Expert Contract | Accepted |
| [ADR-0009](../adr/ADR-0009-critic-subcategories.md) | Critic Subcategories | Accepted |

## Current Tech Stack

Approved (ADR-0003) — no need to read the ADR to get the list:

- **Language / Runtime:** TypeScript, Node.js
- **Frontend:** React, Next.js, Tailwind CSS, shadcn/ui
- **Persistence:** PostgreSQL, Prisma — Phase 2+ only; Phase 1 uses local JSON, single-user.
- **AI:** official provider SDKs only (Anthropic SDK first, Sprint 04) — no orchestration
  frameworks (LangChain, LlamaIndex, or similar).
- **Deployment targets:** Windows, Linux, Docker Compose, VPS, dedicated server, cloud.

See [PROJECT_STATE.md](PROJECT_STATE.md) for current phase status and
[ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) for the full rationale.

## Immediate Next Task

Sprint 20 (see CURRENT_SPRINT.md) — not yet scoped. Sprint 19 (Critic subcategories) is closed.
Playwright E2E smoke tests are in place (`apps/studio/e2e/smoke.spec.ts`, 12 tests, all green). Run
`npm run test:e2e` from `apps/studio/` to execute.

## Current Priorities

1. Sprint 18+ — next sprint(s) TBD, see CURRENT_SPRINT.md.
2. Backfill remaining Sprint 02 context (pricing, security) — see
   [docs/vision/pricing.md](../vision/pricing.md) and
   [docs/vision/security.md](../vision/security.md), both still placeholders.

## Working Style

Think before coding. Prefer the smallest working slice over a complete design. Ask when a
requirement is ambiguous rather than assuming. Make changes in small, reviewable iterations —
this project has already paused mid-sprint more than once to review documentation before
continuing.

## Important Rules

- **Evolutionary architecture:** the principle still applies to future, not-yet-built
  capabilities — earn contracts from a working example before generalizing them. The specific
  historical trigger (don't add a second Expert before the Line Editor validates the contract)
  is resolved: the Expert Contract is ratified (ADR-0004) and reused by three more Experts.
- **Documentation-first discipline:** architectural decisions get an ADR; sprint work gets a
  report in `docs/reports/`; project snapshots live in `docs/project/`. Don't let decisions
  live only in conversation.
- **Architecture Review before commit:** documentation and architecture changes are reviewed
  before being committed. See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md). As of Sprint
  13, this project works without a separate Architect session — the Programmer (Executor) role
  writes its own Step Cards, and the Product Owner reviews directly (`STATUS: OK`) instead of a
  separate Architect. The two-role review principle itself (don't commit unreviewed) is
  unchanged — only who plays Architect.
- **Preferred terminology:** "Literary Studio", "AI-powered IDE for writers", "Expert" /
  "Professional Role", "Framework" (the `framework/` system), "Studio App" (the `apps/studio/`
  Next.js application).

## Avoid

- Speculatively designing contracts for capabilities that don't exist yet — earn them from a
  working example first (the general evolutionary-architecture principle; the specific
  historical Expert Contract instance of it is resolved, see Architecture above).
- Committing without an Architecture Review pass, or committing on someone else's behalf.
- Adding functionality, dependencies, or scope beyond what was explicitly requested.
- Treating conversation history as a source of truth — if a decision isn't in the repository,
  it isn't decided (see [PROJECT_STATE.md](PROJECT_STATE.md)'s Source of Truth).

## If You Are Unsure

Read [PROJECT_STATE.md](PROJECT_STATE.md), then [CURRENT_SPRINT.md](CURRENT_SPRINT.md), then
the relevant ADRs. If it's still unclear, ask — don't guess and proceed.

## Repository Structure

```
apps/studio/       — Studio App (Next.js) — the only application so far
framework/         — Expert/workflow/memory system (empty scaffolding, Sprint 01)
prompts/           — prompt templates for the Framework (empty scaffolding, Sprint 01)
templates/, examples/, tests/, assets/  — supporting material (empty scaffolding)
docs/
  adr/             — Architecture Decision Records
  architecture/    — architecture notes (empty)
  research/        — research notes (empty)
  vision/          — roadmap, pricing, security, and pointer to backlog
  project/         — this directory: charter, state, sprint, backlog, handover, workflow
  reports/         — sprint reports
```
