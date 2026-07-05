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

Sprint 06 (Architecture Refactor) is closed. Sprint 07 has not been started and has no
defined scope. See [CURRENT_SPRINT.md](CURRENT_SPRINT.md) for live status.

## Architecture

- Repository is an ecosystem monorepo, not just an app: `apps/` (delivery applications) sits
  alongside `framework/` (the Expert/workflow/memory system), `prompts/`, and `docs/`. See
  [ADR-0001](../adr/ADR-0001-repository-structure.md).
- The Expert Contract is deliberately not yet designed — evolutionary architecture. The first
  Expert implementation is expected to *discover* the contract, not implement a predefined one.
  See [ADR-0002](../adr/ADR-0002-expert-contract-vision.md).
- The technology stack (below) is fixed by
  [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) — check it before adding any new
  framework, SDK, or runtime dependency.

## Current Status

- `apps/studio/` is a working Literary Studio MVP: Book → Chapter → Scene structure, a real
  scene text editor, AI-assisted editing via the Line Editor Expert, Focus Mode, and
  `localStorage` persistence (all from Sprint 05) — layered on top of a domain-driven
  architecture (from Sprint 06).
- **Architecture (post-Sprint-06):**
  `UI (page.tsx, orchestration only) → Workspace Controller (useWorkspaceController) →
  Workspace (domain/workspace.ts) → AI Bus (aiBus.execute) → Operation → Context Envelope →
  Response → Applied Response → /api/line-editor (unchanged since Sprint 04)`.
  - `apps/studio/src/domain/` — single source of truth for `Book`/`Chapter`/`Scene`/`Workspace`.
  - `apps/studio/src/ai/` — AI Bus v5 contracts (`operations.ts`, `context.ts`, `response.ts`,
    `applier.ts`, `aiBus.ts`).
  - `apps/studio/src/storage/workspaceStorage.ts` — the only place that touches `localStorage`.
  - `apps/studio/src/workspace/useWorkspaceController.ts` — owns all `Workspace` state and
    mutation logic.
- **Known gap:** `apps/studio/src/components/LineEditorPanel.tsx` still calls
  `/api/line-editor` directly, bypassing the AI Bus — out of scope for every Sprint 06 step,
  carried forward as an open item.
- `framework/`, `prompts/`, `templates/`, `examples/`, `tests/`, `assets/` are still empty
  scaffolding from Sprint 01.
- Documentation (this file included) was substantially expanded in Sprint 03 via an
  Architecture Review process, and again updated at Sprint 06 closeout.

## Accepted ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../adr/ADR-0001-repository-structure.md) | Repository Structure | Accepted |
| [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) | Expert Contract Vision | Proposed |
| [ADR-0003](../adr/ADR-0003-technology-stack-strategy.md) | Technology Stack Strategy | Accepted |

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

None defined in the repository. Sprint 06 is closed; Sprint 07 has not been scoped. Scoping
the next sprint is a Product Owner / Architect decision that has not yet been made — do not
start implementation work under an assumed Sprint 07 scope.

## Current Priorities

1. Formalize the Expert Contract extraction (Sprint 04) as the superseding ADR that
   [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) calls for — still pending.
2. Backfill remaining Sprint 02 context (pricing, security) — see
   [docs/vision/pricing.md](../vision/pricing.md) and
   [docs/vision/security.md](../vision/security.md), both placeholders.
3. Decide Sprint 07 scope with the Product Owner / Architect.

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
  by the Product Owner and Architect before being committed. See
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
