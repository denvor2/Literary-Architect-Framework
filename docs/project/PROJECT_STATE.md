# Literary Studio — Project State

A current snapshot. Updated at the end of each sprint (see
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)) — if you're reading this later than the
date below, check the latest `docs/reports/SPRINT-*.md` for anything more recent.

**Last updated:** 2026-07-10 (Sprint 16-17 closing + E2E tests)
**Project Health:** Healthy — on track. Sprint 05 through Sprint 16-17 are all complete and
committed; no blocking issues. Playwright E2E smoke tests (12 tests, all green) are in place.
This project is currently working without a separate Architect session — the Product Owner
reviews directly instead (see [HANDOVER.md](HANDOVER.md)).
**Current Phase:** Phase 1 (MVP).

## Source of Truth

Authoritative for project state, in order: this document, Accepted ADRs (`docs/adr/`), and the
latest Sprint Report (`docs/reports/`). Conversation history is not authoritative — if it's not
here, it's not decided.

## Current Sprint

Sprint 18 — Ideas/Notes (see `docs/project/ROADMAP_18-27.md`). Not yet scoped. Sprint 16-17
(unified book view + collapsible navigation tree) is closed — committed `62ed860`. Playwright
E2E smoke tests added post-close — committed `2a28fa6`.

**Sprint 16-17 — Unified Book View (closed).** Replaced the three-screen split (book overview /
chapter overview / single-scene editor) with a single continuous, scrollable `UnifiedBookView`
with collapse/expand at every level; sidebar tree clicks now scroll instead of switching screens;
`focusedSceneKey` (textarea focus tracking) drives assistant panel context. Committed `62ed860`.

**Sprint 13 — Unified Chat Mechanism (closed).** Gave every Product Role a real, persisted
message history: `assistantThreads` domain model + persisted assistant mode; all four Expert
routes accept client-managed `messages` (server stays stateless, ADR-0004 unchanged); AI Bus
operations renamed to `sceneText`+`messages`; controller mutations
(`appendMessage`/`createThread`/`activeThreads`); and a real chat UI replacing the old
one-shot dropdown+button, consolidated into a single functional `AssistantPanel.tsx` (mode
cards + responsive `lg:` layout), which also meant deliberately dropping Sprint 05's old
`MODE_INFO` "perception layer" (fake scene phase/consistency, a "no memory" disclosure that
would now be literally false with real persisted history). No new ADR — a domain-model/UI
extension of the already-ratified stateless Expert Contract, not a new Expert or contract
change. See [CURRENT_SPRINT.md](CURRENT_SPRINT.md)'s git history for the full closing summary
(one commit before the current Sprint 14 version of that file).

## Completed Milestones

- **Sprint 01** — repository foundation: directory skeleton for the ecosystem
  (`framework/`, `prompts/`, `docs/`, `templates/`, `examples/`, `tests/`, `assets/`).
- **Sprint 02** — product vision, UX concept, roadmap, pricing strategy, security
  requirements, and Scrum workflow decided outside the repository (not yet fully backfilled —
  see `docs/vision/pricing.md` and `docs/vision/security.md`).
- **Sprint 03** — Studio App scaffolded (`apps/studio/`, Next.js/TypeScript/Tailwind), build
  and dev server validated, first architectural documentation set created, Architecture Review
  approved, committed as `fd253b0` and tagged `v0.1.0-foundation`. See
  [docs/reports/SPRINT-03.md](../reports/SPRINT-03.md).
- **Sprint 04** — ADR-0003 (Technology Stack Strategy) adopted; Task Bus v4 (then still named
  "AI Bus v4") established as the canonical, now-frozen execution protocol; Anthropic integration built and live-validated
  (Test Connection and Line Editor both confirmed with real Claude responses); a full Literary
  Studio product documentation suite committed (Product Vision, Domain Model, User Model,
  Expert Catalog, Book Lifecycle, MVP Scope). See [docs/reports/SPRINT-04.md](../reports/SPRINT-04.md).
- **Sprint 05** — Literary Studio MVP UI built on top of the Sprint 04 Line Editor endpoint:
  Book → Chapter → Scene structure, a real scene text editor, AI-assisted "Редактор" flow with
  preview/replace, Focus Mode, single-key `localStorage` persistence, and a layered
  role-perception UI (Co-author/Editor/Critic/Reader) with explicit no-memory disclosure. No
  backend or API changes. See [docs/reports/SPRINT-05.md](../reports/SPRINT-05.md).
- **Sprint 06** — Architecture refactor underneath the frozen Sprint 05 UI, with zero
  user-visible behavior change: Domain Model (`Book`/`Chapter`/`Scene`/`Workspace`) established
  as the single source of truth; AI Bus v5 introduced as a four-stage contract
  (Operation → Context Envelope → Response → Applied Response) in front of `/api/line-editor`;
  persistence isolated into a dedicated storage module; Workspace mutation/selection logic
  extracted into a `useWorkspaceController` hook, reducing `page.tsx` to orchestration-only
  composition (174 → 67 lines). All nine steps validated (build/lint/prettier/grep/runtime) and
  committed. See [docs/reports/SPRINT_06_REPORT.md](../reports/SPRINT_06_REPORT.md).
- **Sprint 07** — architecture ratification and cleanup, no user-visible behavior change.
  **Step 00:** model-specific role labels ("ChatGPT (Chief Software Architect)", "Claude (Lead
  Software Engineer / Executor)") replaced with model-independent **Architect** / **Programmer
  (Executor)** across the Task Bus protocol and project docs; a git-based, tool-free handoff
  channel (`docs/task-bus/queue/pending/active/done`) introduced for exchanging Step Cards, ARPs,
  and Reviews. Committed `430edd61d2b336bd3f12de79ed491d8669e3ac6e`.
  **Step 01:** [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) formalized the Line
  Editor's request/response schema, AI Bus v5 chain position, error model, and
  deterministic/stateless behavior, grounded in file+line citations against the running code;
  superseded [ADR-0002](../adr/ADR-0002-expert-contract-vision.md). Committed
  `f7d2c9177f4dbfc5fccfd65e9ba2566984befa30`.
  **Step 02:** closed the last direct `fetch("/api/line-editor")` call in the UI layer
  (`LineEditorPanel.tsx`), routing it through `aiBus.execute()` instead — no UI-visible change.
  Committed `73e59e64328ce042ae3b68e742a83a59a2ca371c`.
- **Sprint 08** — built and ratified the project's second AI Expert, Critic, end to end:
  `/api/critic` backend (discovery implementation, mirrors Line Editor's shape but returns
  structured `reviews` instead of text); `aiBus.execute()`'s first real dispatch by
  `operation.type` (`critic_review` alongside `improve_text`); Critic UI wiring in
  `EditorArea.tsx` (text-selection capture, Review-not-Revision presentation — no "Заменить
  текст"); a responsive review panel (pure CSS breakpoint, cards with category/severity
  badges); and [ADR-0005](../adr/ADR-0005-critic-expert-contract.md), ratifying the Critic
  Expert contract and resolving `docs/product/DOMAIN_MODEL.md`'s Product Role → AI Expert
  mapping question for Critic specifically (Co-author/Editor/Reader remain unresolved).
- **Sprint 09** — built and ratified the project's third AI Expert, Reader, end to end:
  `/api/reader` backend (discovery implementation, mirrors Line Editor's shape — a whole
  reaction string, not Critic's structured list — with the project's first explicit
  language instruction, Russian, in its system prompt); `aiBus.execute()`'s third dispatch
  branch (`reader_reaction`, added without new technical debt since the response is already
  string-shaped); Reader UI wiring in `EditorArea.tsx` (`handleReader()`, Review-not-Revision
  presentation, same principle as Critic); and
  [ADR-0006](../adr/ADR-0006-reader-expert-contract.md), ratifying the Reader Expert contract
  and resolving `docs/product/DOMAIN_MODEL.md`'s Product Role → AI Expert mapping question for
  Reader specifically (Co-author/Editor remain unresolved). Committed `5418ff3`, `bb9df12`,
  `6ad8aac`.
- **Sprint 10** — Character introduced as a new domain entity (`id`/`name`/`description`/
  `notes`/`photoUrl`) with its own editing panel, auto-selection on creation, and a red-accented
  delete button; Chapter gained a `subtitle` field and its own editing panel; Scene gained an
  editable title (separate from its text content) and auto-selection on creation, including
  when created for a non-currently-selected chapter; Sidebar navigation gained a path back to
  the book overview and unified creation buttons for Book/Chapter/Scene/Character; new
  `docs/design/UI_STYLE_GUIDE.md` codified button/color conventions, applied retroactively.
  Two real bugs found and fixed: a Scene-highlight collision across chapters with colliding
  ids, and controlled/uncontrolled input warnings on pre-sprint saved data missing new fields.
  **No ADR produced this sprint** — pure domain/UI extension, no new AI Expert or AI Bus
  change; not an oversight, see [CURRENT_SPRINT.md](CURRENT_SPRINT.md). Committed `0e0668c`,
  `2a0107b`, `03f0b0e`, `d4c7172`, `3b62f5f`, `3159229`, plus several small fix/UX commits in
  the same window (see CURRENT_SPRINT.md's Tasks list for the complete, honest set).
- **Sprint 11** — replaced the single-book `Workspace` with a multi-book one, closing a real
  data-loss risk (the Product Owner actually lost their first book creating a second one,
  before this sprint's migration existed — recorded plainly in ADR-0007, not softened). `Book`
  became self-contained (`chapters`/`characters` moved inside it); `workspaceStorage.ts` gained
  a migration for the old single-book format and `normalizeBook()`, a centralized-defaults
  pattern born from three recurring instances of the same bug class (missing fields on old
  saved data — Workspace `characters`, `Chapter.subtitle`, now `Book` fields).
  [ADR-0007](../adr/ADR-0007-multi-book-workspace.md) ratifies this — the project's first ADR
  outside the AI Expert Contract family. Committed `385d10e`, `6793fa4`, `3b96695`, `beaab6e`,
  `f99910c`.
- **Sprint 12** — built the project's fourth AI Expert, Co-author, end to end: `/api/coauthor`
  backend (discovery implementation, the first genuinely generative Expert — produces a
  Revision, not a Review — and the first to receive the whole `Book` as context, not just the
  current scene; `currentText` may be empty for a blank-page draft, `bookContext` is required);
  `aiBus.execute()`'s fourth dispatch branch (`coauthor_draft`, requiring the previously shared
  `{ text }` destructure to move into each branch individually since Co-author's payload shape
  differs); `/api/line-editor` extended with an optional `bookContext` (consistency only, task
  unchanged, backward compatible); Co-author UI wiring in `EditorArea.tsx` (`handleCoauthor()`,
  reusing Editor's Original/Improved preview since both produce Revisions); and
  [ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md), ratifying the Co-author Expert
  contract and resolving `docs/product/DOMAIN_MODEL.md`'s last open Product Role → AI Expert
  mapping question. [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) revised (not
  superseded) to record Editor's book-context extension. Two real UI bugs found via Product
  Owner screenshots and fixed as emergency Step Cards (assistant button label not reflecting
  mode, then unified to a single "Спросить" label). Committed `05c820c`, `4b2f7c5`, `5ba7929`,
  `bee042e`, `5785ce2`, `18b4f21`.
- **Sprint 13** — Domain model (`assistantThreads`), all four Expert routes, AI Bus, workspace
  controller, and UI all gained real persisted per-role message history, replacing the one-shot
  request model used since Sprint 05. Committed `f68e676`, `5c2d3e9`, `db8b510`, `af18c4b`,
  `39ee241`.
- **Sprint 14** — Reader Multiple Named Instances (closed). See "Current Sprint" above.
  Committed `e41793e`, `49f27ca`. [ADR-0006](../adr/ADR-0006-reader-expert-contract.md)
  revised (not superseded).
- **Sprint 15** — Systematic Localization (closed). Line Editor/Critic system prompts switched
  to follow `bookContext.language` (not hardcoded Russian); English UI-copy audit and translation
  pass across all components. Committed `fccaf41`, `8eeb724`, `c32b6ff`.
- **Sprint 16-17** — Unified Book View + Collapsible Navigation Tree (closed). Three-screen
  split replaced by `UnifiedBookView`; collapse/expand at every level; sidebar tree scrolls to
  blocks instead of switching screens. Committed `62ed860`. Playwright E2E smoke tests (12
  tests) added post-close — committed `2a28fa6`.

## Current Architecture

- Repository is an ecosystem monorepo: `apps/` (delivery applications) sits alongside
  `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract has been ratified as
  [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) (Line Editor, revised Sprint 12),
  [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) (Critic),
  [ADR-0006](../adr/ADR-0006-reader-expert-contract.md) (Reader, revised Sprint 14), and
  [ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md) (Co-author) — request/response schema,
  AI Bus v5 chain position, error model, and deterministic behavior, each grounded in a
  file+line citation against the running code. ADR-0004 supersedes
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).
  [ADR-0007](../adr/ADR-0007-multi-book-workspace.md) ratifies the Sprint 11 multi-book
  Workspace change — the first ADR outside this Expert Contract family.
- The technology stack is fixed by [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) —
  any new framework, SDK, or runtime dependency should be checked against it before being added.
- `apps/studio/` has a working Anthropic integration with four Experts: Line Editor
  (`/api/line-editor`, Test Connection), Critic (`/api/critic`), Reader (`/api/reader`), and
  Co-author (`/api/coauthor`), all live-validated with real Claude responses. Line Editor and
  Co-author both optionally/always (respectively) receive the whole `Book` as context; Critic
  and Reader remain scene/selection-scoped by design (see ADR-0008's per-Expert context-scope
  table).
- **AI Bus layering (Sprint 06, extended Sprint 08/09/12/13):**
  `UI (page.tsx, orchestration only) → Workspace Controller (useWorkspaceController) →
  Workspace (domain/workspace.ts) → AI Bus (aiBus.execute, dispatches by operation.type) →
  Operation → Context Envelope → Response → Applied Response → /api/line-editor |
  /api/critic | /api/reader | /api/coauthor`. `aiBus.execute()` performs real dispatch since
  Sprint 08 Step 02 — previously `operation.type` was read only decoratively. Since Sprint 13,
  `AIOperation`'s four variants share a uniform `sceneText`+`messages` shape (`text`/
  `currentText` unified into `sceneText`; `messages: ChatMessage[]` required on every variant —
  the server stays stateless, ADR-0004 unchanged, the client sends the whole conversation on
  every call).
- **Domain Model (extended Sprint 11 — [ADR-0007](../adr/ADR-0007-multi-book-workspace.md) —
  and Sprint 13):** `Workspace` holds `books: Book[]` + `activeBookId` + `selectedAssistantMode`
  (persisted across sessions since Sprint 13); `Book` is a self-contained container —
  `chapters`/`characters`/`assistantThreads` all live inside it. `assistantThreads` (Sprint 13)
  holds one or more named `AssistantThread`s (`{ id, name, messages: ChatMessage[], persona?:
  string }`) per Product Role — Co-author/Editor always use a single continuous thread; Critic
  still only exposes the last/active one in the UI (unchanged, out of Sprint 14 scope); Reader
  (Sprint 14) surfaces all of them as named, comparable instances, each optionally carrying a
  `persona` that's folded into `/api/reader`'s system prompt when present. Domain types
  (`Book`/`Chapter`/`Scene`/`Character`/`Workspace`/`AssistantThread`/`ChatMessage`) live in
  `apps/studio/src/domain/` as the single source of truth; `localStorage` access is isolated in
  `apps/studio/src/storage/workspaceStorage.ts`,
  which also holds `migrateIfNeeded()` (old-format migration) and `normalizeBook()` (centralized
  field-defaulting for `Book`, a documented practice per ADR-0007 for any future field added to
  `Book`).
- Product Role → AI Expert mapping: all four Product Roles now map 1:1 to their own Expert —
  Critic → Critic Expert ([ADR-0005](../adr/ADR-0005-critic-expert-contract.md)), Reader →
  Reader Expert ([ADR-0006](../adr/ADR-0006-reader-expert-contract.md)), Editor → Line Editor
  Expert ([ADR-0004](../adr/ADR-0004-expert-contract-specification.md)), and Co-author →
  Co-author Expert ([ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md), Sprint 12 —
  resolving the last unmapped Product Role). Whether Editor should eventually be a composite of
  several ADR-0002 Experts remains unspecified.

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Superseded by ADR-0004 |
| [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) | Technology Stack Strategy | Accepted |
| [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) | Expert Contract Specification | Accepted, revised Sprint 12 |
| [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) | Critic Expert Contract | Accepted |
| [ADR-0006](../adr/ADR-0006-reader-expert-contract.md) | Reader Expert Contract | Accepted |
| [ADR-0007](../adr/ADR-0007-multi-book-workspace.md) | Multi-Book Workspace | Accepted |
| [ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md) | Co-author Expert Contract | Accepted |

## Technology Stack

Approved by [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md):

- **Language / Runtime:** TypeScript, Node.js
- **Frontend:** React, Next.js, Tailwind CSS, shadcn/ui
- **Persistence:** PostgreSQL, Prisma (ORM) — Phase 2+; Phase 1 continues using local JSON,
  single-user, no database.
- **AI Integration:** official provider SDKs only — Anthropic SDK integrated and
  live-validated in Sprint 04 (Test Connection, Line Editor); no orchestration frameworks
  (LangChain, LlamaIndex, or similar).
- **Deployment targets:** Windows, Linux, Docker Compose, VPS, dedicated server, cloud —
  without architectural changes between them.

## Current Priorities

1. Sprint 18+ — next sprint(s) TBD, see `docs/project/ROADMAP_18-27.md` and
   [CURRENT_SPRINT.md](CURRENT_SPRINT.md).
2. Backfill remaining Sprint 02 context (pricing, security) — see
   `docs/vision/pricing.md` and `docs/vision/security.md`, both still placeholders.

## Open Decisions

- **Pricing and detailed security requirements** — Sprint 02 conclusions not yet backfilled;
  see `docs/vision/pricing.md` and `docs/vision/security.md`.
- **Whether Critic should reuse Reader's Sprint 14 multi-instance mechanism** for its own future
  thematic subcategories (Sprint 18), or needs a genuinely different shape — open, recorded in
  [ADR-0006](../adr/ADR-0006-reader-expert-contract.md)'s Review Trigger.

## Known Risks

- **Data loss on new book creation — resolved in Sprint 11.** `Workspace` now supports multiple
  books (`books: Book[]`); creating a new book appends rather than replaces. See
  [ADR-0007](../adr/ADR-0007-multi-book-workspace.md). **The book lost before this migration
  existed cannot be recovered** — recorded permanently, not implying the fix undoes the past
  incident.
- Sprint 02 decisions (pricing, detailed security requirements) remain partially undocumented
  in-repo.
- Sprint 06's commit (`f82f650`) necessarily bundled the entire, previously-never-committed
  Sprint 05 UI layer together with the Sprint 06 architecture work — the two could not be
  separated in git history at commit time. See
  [docs/reports/SPRINT_06_REPORT.md](../reports/SPRINT_06_REPORT.md) for detail.

## Next Milestone

Sprint 18 (Ideas/Notes) — see `docs/project/ROADMAP_18-27.md`.
