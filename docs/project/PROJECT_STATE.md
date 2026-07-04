# Literary Studio — Project State

A current snapshot. Updated at the end of each sprint (see
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)) — if you're reading this later than the
date below, check the latest `docs/reports/SPRINT-*.md` for anything more recent.

**Last updated:** 2026-07-04 (Sprint 03)
**Project Health:** Healthy — on track, no blocking issues.
**Current Phase:** Phase 1 (MVP).

## Source of Truth

Authoritative for project state, in order: this document, Accepted ADRs (`docs/adr/`), and the
latest Sprint Report (`docs/reports/`). Conversation history is not authoritative — if it's not
here, it's not decided.

## Current Sprint

Sprint 03 — First Implementation Sprint. See
[CURRENT_SPRINT.md](CURRENT_SPRINT.md) for live status and
[docs/reports/SPRINT-03.md](../reports/SPRINT-03.md) for the full report.

## Completed Milestones

- **Sprint 01** — repository foundation: directory skeleton for the ecosystem
  (`framework/`, `prompts/`, `docs/`, `templates/`, `examples/`, `tests/`, `assets/`).
- **Sprint 02** — product vision, UX concept, roadmap, pricing strategy, security
  requirements, and Scrum workflow decided outside the repository (not yet fully backfilled —
  see `docs/vision/pricing.md` and `docs/vision/security.md`).
- **Sprint 03** — Studio App scaffolded (`apps/studio/`, Next.js/TypeScript/Tailwind), build
  and dev server validated, first architectural documentation set created (this file included).

## Current Architecture

- Repository is an ecosystem monorepo: `apps/` (delivery applications) sits alongside
  `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract is not yet ratified — Sprint 04's Line Editor will discover it. See
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).
- `apps/studio/` is currently the unmodified Next.js starter — no application logic yet.

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Proposed |

## Technology Stack

- **Studio App:** Next.js, TypeScript, React, Tailwind CSS, App Router.
- **Storage (Phase 1):** local JSON, single-user.
- **AI provider:** Anthropic (Claude) — not yet integrated (planned Sprint 04).
- **Planned (Phase 2+):** SQLite/PostgreSQL, user accounts, cloud sync, AI orchestration layer.

## Current Priorities

1. Backfill remaining Sprint 02 context (pricing, security) into `docs/vision/`.
2. Sprint 04: implement the first Expert (Line Editor) end-to-end and discover the Expert
   Contract from it.
3. Decide a `.env`/secrets convention before any AI integration lands.

## Open Decisions

- **Expert Contract** — intentionally deferred until the Line Editor (Sprint 04) discovers it;
  tracked by [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).
- **Secrets strategy** — how `.env` / API keys are handled; needed before Sprint 04's Anthropic
  integration.
- **Pricing and detailed security requirements** — Sprint 02 conclusions not yet backfilled;
  see `docs/vision/pricing.md` and `docs/vision/security.md`.

## Known Risks

- Sprint 02 decisions (pricing, detailed security requirements) remain partially undocumented
  in-repo.
- No secrets-handling convention yet decided, needed before Sprint 04.
- ADR-0002 is intentionally unratified — a second Expert must not be started before the Line
  Editor discovers and ratifies the contract (see ADR-0002's Review Trigger).

## Next Milestone

Sprint 04: a working Line Editor Expert, callable from the Studio App UI, backed by a real
Claude request — and the resulting Expert Contract ADR.
