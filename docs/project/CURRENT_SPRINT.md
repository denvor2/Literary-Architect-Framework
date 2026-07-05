# Current Sprint

**Sprint 07 — Architecture Ratification & AI Bus Formalization** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History lives in `docs/reports/SPRINT_06_REPORT.md` for Sprint 06, not
here.

- **Status:** In Progress. Step 00 complete; Step 01 not yet started.
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
- [ ] **Step 01 — Expert Contract ADR.** Not yet started. Will formalize the request/response
      schema, error model, prompt contract, and deterministic behavior extracted from the Line
      Editor implementation (Sprint 04) as the superseding ADR that ADR-0002 calls for.

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

## Known Open Items (carried forward, not part of Sprint 07 Step 00)

- `LineEditorPanel.tsx` still calls `/api/line-editor` directly, bypassing the AI Bus —
  unresolved since Sprint 06 Step 02.
- `ADR-0002` (Expert Contract Vision) remains `Proposed` — Step 01 of this sprint targets this
  directly.
- The AI Bus v5 architecture (Sprint 06) has no ADR of its own yet — a candidate for a later
  step in this sprint, not yet scheduled.

## Next Action

Begin Step 01 — Expert Contract ADR — once explicitly scoped and approved by the Architect.
