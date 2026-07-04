# Literary Studio — Project State

A current snapshot. Updated at the end of each sprint (see
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)) — if you're reading this later than the
date below, check the latest `docs/reports/SPRINT-*.md` for anything more recent.

**Last updated:** 2026-07-04 (Sprint 04 closing)
**Project Health:** Healthy — on track. Three already-implemented Sprint 04 items remain
uncommitted (see Known Risks); no blocking issues otherwise.
**Current Phase:** Phase 1 (MVP).

## Source of Truth

Authoritative for project state, in order: this document, Accepted ADRs (`docs/adr/`), and the
latest Sprint Report (`docs/reports/`). Conversation history is not authoritative — if it's not
here, it's not decided.

## Current Sprint

Sprint 04 — First Working Expert (closing). See
[CURRENT_SPRINT.md](CURRENT_SPRINT.md) for live status;
[docs/reports/SPRINT-04.md](../reports/SPRINT-04.md) for the full closing report.

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
  Expert Catalog, Book Lifecycle, MVP Scope). Three already-implemented items remain
  uncommitted — see Known Risks. See [docs/reports/SPRINT-04.md](../reports/SPRINT-04.md).

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
- `apps/studio/` now has a working Anthropic integration (Test Connection + Line Editor
  Expert), live-validated with real Claude responses. The Line Editor code itself is not yet
  committed (see Known Risks).

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

1. Commit the three already-implemented, already-validated Sprint 04 items that remain
   uncommitted: root `CLAUDE.md`, the Line Editor implementation, and the superseding Expert
   Contract ADR (from the completed extraction).
2. Backfill remaining Sprint 02 context (pricing, security) into `docs/vision/`.
3. Open Sprint 05: begin Literary Studio MVP implementation using AI Bus v4 as a fixed
   platform.

## Open Decisions

- **Expert Contract ratification** — the contract has been extracted from the Line Editor
  implementation; it now needs to be written up as the superseding ADR that
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) calls for.
- **Pricing and detailed security requirements** — Sprint 02 conclusions not yet backfilled;
  see `docs/vision/pricing.md` and `docs/vision/security.md`.

## Known Risks

- **Three Sprint 04 deliverables are implemented and validated but not committed:** root
  `CLAUDE.md` (Step 2), the Line Editor implementation (Step 5, live-validated with a real
  Anthropic response), and the Expert Contract extraction (Step 6, delivered but not yet
  written up as an ADR). Repository-first discipline treats uncommitted work as not durably
  "done" — this is the direct successor of the Bootstrap-B/C finding from AI Bus v3/v4.
- Sprint 02 decisions (pricing, detailed security requirements) remain partially undocumented
  in-repo.
- ADR-0002 remains intentionally unratified — a second Expert must not be started before the
  Expert Contract extraction is formalized as a superseding ADR (see ADR-0002's Review
  Trigger).

## Next Milestone

Sprint 05: begin Literary Studio MVP implementation (per
`docs/product/MVP_SCOPE.md`) using AI Bus v4 as a fixed, frozen execution platform.
