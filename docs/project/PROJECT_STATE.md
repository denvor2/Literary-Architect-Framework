# Literary Studio — Project State

A current snapshot. Updated at the end of each sprint (see
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)) — if you're reading this later than the
date below, check the latest `docs/reports/SPRINT-*.md` for anything more recent.

**Last updated:** 2026-07-05 (Sprint 06 closing)
**Project Health:** Healthy — on track. Sprint 05 and Sprint 06 are both complete and
committed; no blocking issues. See Known Risks for open, non-blocking items.
**Current Phase:** Phase 1 (MVP).

## Source of Truth

Authoritative for project state, in order: this document, Accepted ADRs (`docs/adr/`), and the
latest Sprint Report (`docs/reports/`). Conversation history is not authoritative — if it's not
here, it's not decided.

## Current Sprint

Sprint 06 — Architecture Refactor (closed). Sprint 07 not started, no scope defined. See
[CURRENT_SPRINT.md](CURRENT_SPRINT.md) for live status;
[docs/reports/SPRINT_06_REPORT.md](../reports/SPRINT_06_REPORT.md) for the full closing
report.

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

## Current Architecture

- Repository is an ecosystem monorepo: `apps/` (delivery applications) sits alongside
  `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract has been **extracted** from the Line Editor implementation (request/
  response schema, error model, prompt contract, deterministic behavior) but is not yet
  ratified as a superseding ADR. See [ADR-0002](../adr/ADR-0002-expert-contract-vision.md),
  still `Proposed`, pending that follow-up ADR.
- The technology stack is fixed by [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) —
  any new framework, SDK, or runtime dependency should be checked against it before being added.
- `apps/studio/` has a working Anthropic integration (Test Connection + Line Editor Expert),
  live-validated with real Claude responses.
- **Post-Sprint-06 layering:**
  `UI (page.tsx, orchestration only) → Workspace Controller (useWorkspaceController) →
  Workspace (domain/workspace.ts) → AI Bus (aiBus.execute) → Operation → Context Envelope →
  Response → Applied Response → /api/line-editor (unchanged)`.
  Domain types (`Book`/`Chapter`/`Scene`/`Workspace`) live in `apps/studio/src/domain/` as the
  single source of truth; `localStorage` access is isolated in
  `apps/studio/src/storage/workspaceStorage.ts`.
- `apps/studio/src/components/LineEditorPanel.tsx` still calls `/api/line-editor` directly,
  bypassing the AI Bus — a known, explicitly out-of-scope gap carried since Sprint 06 Step 02
  (see Known Risks).

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Proposed |
| [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) | Technology Stack Strategy | Accepted |

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

1. Formalize the Expert Contract extraction (from Sprint 04) as the superseding ADR that
   [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) calls for — still pending, unrelated
   to Sprint 06.
2. Backfill remaining Sprint 02 context (pricing, security) into `docs/vision/`.
3. Decide Sprint 07 scope — not yet started, no plan exists in the repository.

## Open Decisions

- **Expert Contract ratification** — the contract has been extracted from the Line Editor
  implementation; it now needs to be written up as the superseding ADR that
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) calls for.
- **Pricing and detailed security requirements** — Sprint 02 conclusions not yet backfilled;
  see `docs/vision/pricing.md` and `docs/vision/security.md`.
- **Sprint 07 scope** — not defined. Requires a Product Owner / Chief Software Architect
  planning pass before any implementation work starts.

## Known Risks

- **`LineEditorPanel.tsx` bypasses the AI Bus** — it still calls `/api/line-editor` directly
  instead of going through `aiBus.execute()`. Flagged since Sprint 06 Step 02; every subsequent
  step's file-scope restriction kept it explicitly out of reach. Not a behavior risk (the
  endpoint contract is identical either way), but an architectural inconsistency.
- Sprint 02 decisions (pricing, detailed security requirements) remain partially undocumented
  in-repo.
- ADR-0002 remains intentionally unratified — a second Expert must not be started before the
  Expert Contract extraction is formalized as a superseding ADR (see ADR-0002's Review
  Trigger).
- Sprint 06's commit (`f82f650`) necessarily bundled the entire, previously-never-committed
  Sprint 05 UI layer together with the Sprint 06 architecture work — the two could not be
  separated in git history at commit time. See
  [docs/reports/SPRINT_06_REPORT.md](../reports/SPRINT_06_REPORT.md) for detail.

## Next Milestone

None defined. Sprint 06 is closed; Sprint 07 has not been started and has no scope in this
repository yet.
