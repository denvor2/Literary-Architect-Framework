# Current Sprint

**Sprint 07 — Architecture Ratification & AI Bus Formalization** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History lives in `docs/reports/SPRINT_06_REPORT.md` for Sprint 06; Sprint 07
has no separate closeout report at this time (see Next Action).

- **Status:** Closed. All three steps completed, validated, and committed.
- **Phase:** Phase 1 (MVP)
- **Sprint 08:** Not started. No scope has been defined yet.

## Goal

Close the architecture-ratification gap identified after Sprint 06: put the human/AI
collaboration protocol on a model-independent footing, formalize the Expert Contract (still
`Proposed` since ADR-0002, Sprint 04) as a superseding ADR, and eliminate the one remaining
direct-`fetch` bypass of the AI Bus — before any second AI Expert or new Operation type is
attempted.

## Summary

Sprint 07 was a ratification and cleanup sprint, not a feature sprint — no user-visible
behavior changed at any step.

- **Step 00 — AI Bus Terminology & Channel Formalization.** Replaced model-specific role
  labels ("ChatGPT (Chief Software Architect)", "Claude (Lead Software Engineer / Executor)")
  with model-independent terms **Architect** and **Programmer (Executor)** across the AI Bus
  protocol and project documentation. Added a Role/Model Binding clause
  (`PROJECT_CHARTER.md`) and a Session Refresh Trigger heuristic (`BOOTSTRAP.md`). Introduced
  `docs/ai-bus/queue/` — a git-only handoff channel (`pending/active/done`) for exchanging
  Step Cards, ARPs, and Reviews between Architect and Programmer, including the Programmer's
  response procedure to a committed `REVIEW.md`.
- **Step 01 — Expert Contract ADR.** Created
  [ADR-0004](../adr/ADR-0004-expert-contract-specification.md), formalizing the Line Editor's
  request/response schema, its position in the AI Bus v5 chain, its error model, and its
  deterministic/stateless behavior — every claim grounded in a specific file+line citation
  against the already-running code, not designed in the abstract.
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md) superseded (status updated only;
  content preserved as a historical record).
- **Step 02 — Close the AI Bus Bypass.** `LineEditorPanel.tsx`'s direct
  `fetch("/api/line-editor")` — the last one anywhere in the UI layer, flagged since Sprint 06
  Step 02 — replaced with `aiBus.execute()`, the same pattern already used in `EditorArea.tsx`.
  No UI-visible change to `DeveloperTools`; `/api/line-editor` and `apps/studio/src/ai/**`
  untouched.

## Out of Scope (held constant this sprint)

- A second AI Expert or second Operation type — ADR-0004 ratifies the contract for the
  existing Expert only; it does not itself introduce a second one.
- PostgreSQL / Prisma migration.
- Authentication.
- Any change to `/api/line-editor` request/response contract.
- Any change to UI behavior.

## Tasks (Development Strategy)

- [x] **Step 00 — AI Bus Terminology & Channel Formalization.** Committed
      `430edd61d2b336bd3f12de79ed491d8669e3ac6e`.
- [x] **Step 01 — Expert Contract ADR.** Committed
      `f7d2c9177f4dbfc5fccfd65e9ba2566984befa30`.
- [x] **Step 02 — Close the AI Bus Bypass (LineEditorPanel).** Committed
      `73e59e64328ce042ae3b68e742a83a59a2ca371c`.

## Definition of Done

- Each step validated by `npm run build`, `npm run lint`, and grep-based scope verification
  before proceeding — met for all three steps.
- No step changed `/api/line-editor`, UI behavior, or introduced a second AI Expert ahead of
  Expert Contract ratification — met.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit —
  met; Step 00 required one FIX round before approval.

## Completed

- Step 00: ARP approved (`STATUS: OK`), committed `430edd61d2b336bd3f12de79ed491d8669e3ac6e`.
- Step 01: ARP approved (`STATUS: OK`), committed `f7d2c9177f4dbfc5fccfd65e9ba2566984befa30`.
- Step 02: ARP approved (`STATUS: OK`), committed `73e59e64328ce042ae3b68e742a83a59a2ca371c`.

## Known Open Items (carried forward, not part of Sprint 07 scope)

- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`. Not addressed this sprint; a candidate for a future step.
- `docs/product/DOMAIN_MODEL.md`'s Open Questions (which AI Expert(s) back Co-author/Critic/
  Reader) remain unresolved — explicitly out of scope for ADR-0004 (see its Consequences).

## Next Action

Sprint 08 has not been started and has no defined scope. Scoping it is a Product Owner /
Architect decision, not yet made.
