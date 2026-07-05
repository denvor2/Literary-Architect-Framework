# Current Sprint

**Sprint 07 — Architecture Ratification & AI Bus Formalization** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History lives in `docs/reports/SPRINT_06_REPORT.md` for Sprint 06, not
here.

- **Status:** In Progress. Steps 00–01 complete.
- **Phase:** Phase 1 (MVP)

## Goal

Close the architecture-ratification gap identified after Sprint 06: formalize the Expert
Contract (still `Proposed` since ADR-0002, Sprint 04) as a superseding ADR, and put the AI Bus
v5 architecture and the human/AI collaboration protocol itself on a durable, model-independent
footing — before any second AI Expert or new Operation type is attempted.

## In Scope

- Model-independent role terminology (Architect / Programmer (Executor)) across the AI Bus
  protocol and project documentation.
- A git-based, tool-free channel (`docs/ai-bus/queue/`) for exchanging Step Cards, ARPs, and
  Reviews between Architect and Programmer.
- Formalizing the Expert Contract (extracted in Sprint 04) as a superseding ADR.
- Documenting the AI Bus v5 architecture built in Sprint 06 as its own ADR (currently only
  described in `docs/reports/SPRINT_06_REPORT.md`, not in `docs/adr/`).

## Out of Scope (held constant this sprint)

- A second AI Expert or second Operation type — blocked by ADR-0002's Review Trigger until the
  Expert Contract is formally ratified (see Step 01).
- PostgreSQL / Prisma migration.
- Authentication.
- Any change to `/api/line-editor` request/response contract.
- Any change to UI behavior.

## Tasks (Development Strategy)

- [x] **Step 00 — AI Bus Terminology & Channel Formalization.** Replaced model-specific role
      labels ("ChatGPT (Chief Software Architect)", "Claude (Lead Software Engineer /
      Executor)") with model-independent terms **Architect** and **Programmer (Executor)**
      across `CLAUDE.md`, `docs/project/PROJECT_CHARTER.md`, `DEVELOPMENT_WORKFLOW.md`,
      `HANDOVER.md`, `docs/ai-bus/AI_BUS_V4.md`, `BOOTSTRAP.md`. Added a Role/Model Binding
      clause (`PROJECT_CHARTER.md`). Added a Session Refresh Trigger heuristic
      (`BOOTSTRAP.md`). Created `docs/ai-bus/queue/` (`pending/`, `active/`, `done/`) with a
      `README.md` defining a git-only handoff protocol, including the Programmer's response
      procedure to a committed `REVIEW.md`. Committed:
      `430edd61d2b336bd3f12de79ed491d8669e3ac6e`.
- [x] **Step 01 — Expert Contract ADR.** [ADR-0004](../adr/ADR-0004-expert-contract-specification.md)
      created, formalizing the request/response schema, AI Bus v5 chain position, error model,
      and deterministic/stateless behavior — extracted directly from the Line Editor
      implementation (`route.ts`, `ai/*.ts`), with file+line citations for every claim.
      Supersedes [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) (status updated,
      content otherwise unchanged — historical record). Not yet committed, pending Architect
      review.

## Definition of Done

- Each step validated by `npm run build`, `npm run lint`, and grep-based scope verification
  before proceeding.
- No step changes `/api/line-editor`, UI behavior, or introduces a second AI Expert ahead of
  Expert Contract ratification.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit.

## Completed

- Step 00: delivered as an ARP (including one FIX round — Session Refresh Trigger, build/lint
  confirmation, Programmer Response to Review), approved (`STATUS: OK`), committed as
  `430edd61d2b336bd3f12de79ed491d8669e3ac6e`.
- Step 01: [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) delivered as an ARP
  with a file+line citation for every contractual claim; ADR-0002 status updated to
  Superseded. Not yet committed — pending Architect review (`STATUS: OK`).

## Known Open Items (carried forward)

- `LineEditorPanel.tsx` still calls `/api/line-editor` directly, bypassing the AI Bus —
  unresolved since Sprint 06 Step 02; not addressed by Step 01 (documentation-only step).
- The AI Bus v5 architecture (Sprint 06) has no ADR of its own yet — a candidate for a later
  step in this sprint, not yet scheduled.

## Next Action

Awaiting Architect review (`STATUS: OK`) on Step 01 before commit. Next step after that is not
yet scoped.
