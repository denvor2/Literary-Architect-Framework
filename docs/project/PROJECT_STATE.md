# Literary Studio — Project State

A current snapshot. Updated at the end of each sprint (see
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)) — if you're reading this later than the
date below, check the latest `docs/reports/SPRINT-*.md` for anything more recent.

**Last updated:** 2026-07-05 (Sprint 08 closing)
**Project Health:** Healthy — on track. Sprint 05 through Sprint 08 are all complete and
committed; no blocking issues. See Known Risks for open, non-blocking items.
**Current Phase:** Phase 1 (MVP).

## Source of Truth

Authoritative for project state, in order: this document, Accepted ADRs (`docs/adr/`), and the
latest Sprint Report (`docs/reports/`). Conversation history is not authoritative — if it's not
here, it's not decided.

## Current Sprint

Sprint 08 — Second AI Expert: Critic (closed). All five steps (backend, AI Bus dispatch, UI
wiring, responsive panel, ADR-0005 + closeout) complete. See
[CURRENT_SPRINT.md](CURRENT_SPRINT.md) for the closing summary.

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
- **Sprint 04** — ADR-0003 (Technology Stack Strategy) adopted; AI Bus v4 established as the
  canonical, now-frozen execution protocol; Anthropic integration built and live-validated
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
  (Executor)** across the AI Bus protocol and project docs; a git-based, tool-free handoff
  channel (`docs/ai-bus/queue/pending/active/done`) introduced for exchanging Step Cards, ARPs,
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

## Current Architecture

- Repository is an ecosystem monorepo: `apps/` (delivery applications) sits alongside
  `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract has been ratified as
  [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) (Line Editor) and
  [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) (Critic) — request/response schema,
  AI Bus v5 chain position, error model, and deterministic behavior, each grounded in a
  file+line citation against the running code. ADR-0004 supersedes
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).
- The technology stack is fixed by [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) —
  any new framework, SDK, or runtime dependency should be checked against it before being added.
- `apps/studio/` has a working Anthropic integration with two Experts: Line Editor
  (`/api/line-editor`, Test Connection) and Critic (`/api/critic`), both live-validated with
  real Claude responses.
- **AI Bus layering (Sprint 06, extended Sprint 08):**
  `UI (page.tsx, orchestration only) → Workspace Controller (useWorkspaceController) →
  Workspace (domain/workspace.ts) → AI Bus (aiBus.execute, dispatches by operation.type) →
  Operation → Context Envelope → Response → Applied Response → /api/line-editor |
  /api/critic`. `aiBus.execute()` performs real dispatch since Sprint 08 Step 02 — previously
  `operation.type` was read only decoratively.
  Domain types (`Book`/`Chapter`/`Scene`/`Workspace`) live in `apps/studio/src/domain/` as the
  single source of truth; `localStorage` access is isolated in
  `apps/studio/src/storage/workspaceStorage.ts`.
- Product Role → AI Expert mapping: Critic → Critic Expert is now 1:1
  ([ADR-0005](../adr/ADR-0005-critic-expert-contract.md)). Co-author, Editor, and Reader still
  all call the Line Editor Expert under different UI labels — unresolved.

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Superseded by ADR-0004 |
| [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) | Technology Stack Strategy | Accepted |
| [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) | Expert Contract Specification | Accepted |
| [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) | Critic Expert Contract | Accepted |

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

1. Backfill remaining Sprint 02 context (pricing, security) into `docs/vision/`.
2. Decide Sprint 09 scope — not yet started, no plan exists in the repository.

## Open Decisions

- **Pricing and detailed security requirements** — Sprint 02 conclusions not yet backfilled;
  see `docs/vision/pricing.md` and `docs/vision/security.md`.
- **Sprint 09 scope** — not defined. Requires a Product Owner / Architect planning pass
  before any implementation work starts.

## Known Risks

- Sprint 02 decisions (pricing, detailed security requirements) remain partially undocumented
  in-repo.
- Sprint 06's commit (`f82f650`) necessarily bundled the entire, previously-never-committed
  Sprint 05 UI layer together with the Sprint 06 architecture work — the two could not be
  separated in git history at commit time. See
  [docs/reports/SPRINT_06_REPORT.md](../reports/SPRINT_06_REPORT.md) for detail.

## Next Milestone

None defined. Sprint 08 is closed; Sprint 09 has not been started and has no scope in this
repository yet.
