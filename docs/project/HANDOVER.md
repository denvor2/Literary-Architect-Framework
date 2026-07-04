# Handover

Read this first if you are a new session (human or AI) joining this project cold. It is meant
to make the rest of the repository make sense without re-reading the whole history.

## First Five Minutes

Read, in this order: this file, then
[PROJECT_STATE.md](PROJECT_STATE.md), then
[CURRENT_SPRINT.md](CURRENT_SPRINT.md), then the Accepted ADRs (`docs/adr/`). That's enough
context to pick up the work.

## Project

**Literary Studio** — an AI-powered IDE for writers, not a chat-based writing tool. Writers
work with a team of specialist AI Experts (Professional Roles) that operate directly on a
manuscript. Fiction is the first domain; the architecture is meant to generalize to
screenplays, non-fiction, articles, and technical documentation. Full context:
[README.md](../../README.md), [PROJECT_CHARTER.md](PROJECT_CHARTER.md).

## Current Sprint

Sprint 03 (First Implementation Sprint), wrapping up. See
[CURRENT_SPRINT.md](CURRENT_SPRINT.md) for live status.

## Architecture

- Repository is an ecosystem monorepo, not just an app: `apps/` (delivery applications) sits
  alongside `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract is deliberately not yet designed — evolutionary architecture. The first
  Expert implementation is expected to *discover* the contract, not implement a predefined one.
  See [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).

## Current Status

- `apps/studio/` is an unmodified Next.js (TypeScript, Tailwind, App Router) scaffold. Build
  and dev server are verified working. No application logic, AI integration, auth, or database
  exist yet.
- `framework/`, `prompts/`, `templates/`, `examples/`, `tests/`, `assets/` are still empty
  scaffolding from Sprint 01.
- Documentation (this file included) was substantially expanded in Sprint 03 via an
  Architecture Review process.

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Proposed |

## Current Tech Stack

Next.js, TypeScript, React, Tailwind CSS (Studio App). Local JSON storage, single-user
(Phase 1). Anthropic (Claude) planned as the AI provider, not yet integrated. See
[PROJECT_STATE.md](PROJECT_STATE.md) for the full stack and phase plan.

## Immediate Next Task

Sprint 04: implement the first Expert, **Line Editor**, end-to-end (prompt template + API
route + minimal UI, calling the Anthropic API), then extract the actual Expert Contract from
that implementation, superseding ADR-0002.

## Current Priorities

1. Backfill remaining Sprint 02 context (pricing, security) — see
   [docs/vision/pricing.md](../vision/pricing.md) and
   [docs/vision/security.md](../vision/security.md), both placeholders.
2. Decide a `.env`/secrets convention before any AI integration.
3. Build the Line Editor vertical slice (Sprint 04).

## Working Style

Think before coding. Prefer the smallest working slice over a complete design. Ask when a
requirement is ambiguous rather than assuming. Make changes in small, reviewable iterations —
this project has already paused mid-sprint more than once to review documentation before
continuing.

## Important Rules

- **Evolutionary architecture:** do not design the Expert Contract, or add a second Expert,
  before the Line Editor implementation validates one. See ADR-0002's Review Trigger.
- **Documentation-first discipline:** architectural decisions get an ADR; sprint work gets a
  report in `docs/reports/`; project snapshots live in `docs/project/`. Don't let decisions
  live only in conversation.
- **Architecture Review before commit:** documentation and architecture changes are reviewed
  by the Product Owner and Chief Software Architect before being committed. See
  [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).
- **Preferred terminology:** "Literary Studio", "AI-powered IDE for writers", "Expert" /
  "Professional Role", "Framework" (the `framework/` system), "Studio App" (the `apps/studio/`
  Next.js application).

## Avoid

- Designing the Expert Contract, or adding a second Expert, before the Line Editor discovers
  the contract (see ADR-0002's Review Trigger).
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
