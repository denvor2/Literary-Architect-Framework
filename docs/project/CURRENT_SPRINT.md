# Current Sprint

**Sprint 09 — Third AI Expert: Reader** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/08 lives in `docs/reports/SPRINT_06_REPORT.md` /
this file's own git history; Sprint 09 has no separate closeout report at this time.

- **Status:** Closed. All four steps completed, validated, and committed.
- **Phase:** Phase 1 (MVP)
- **Sprint 10:** Not started. No scope has been defined yet.

## Goal

Build and ratify the project's third AI Expert — Reader — end to end: backend route, AI Bus
dispatch, UI wiring, and a contract ADR, following the same pattern established for Critic in
Sprint 08.

## Summary

- **Step 01 — Backend `/api/reader`.** Discovery implementation mirroring
  `/api/line-editor`'s shape (not Critic's): `POST { text }` → `{ ok: true, result: string }`
  — a whole reaction, not a structured list, per explicit Product Owner decision. First Expert
  with an explicit language instruction: the system prompt instructs the model to respond in
  Russian regardless of input language (per Sprint Owner's localization decision — first
  version of the product is fully Russian; English is planned for Sprint 30-40).
- **Step 02 — AI Bus real dispatch.** `AIOperation` gained its third variant
  (`reader_reaction`); `aiBus.execute()`'s third branch — the first variant added without any
  new technical debt, since `/api/reader`'s response is already string-shaped and needs no
  `JSON.stringify`/TODO the way Critic did.
- **Step 03 — UI wiring.** Reader mode in `EditorArea.tsx` calls `reader_reaction` via a new
  `handleReader()`, reusing `getSelectedText()` unchanged. Reader's result renders as a Review
  (no "Заменить текст"), same principle as Critic.
- **Step 04 — [ADR-0006](../adr/ADR-0006-reader-expert-contract.md) + Sprint closeout.**
  Ratified the Reader Expert contract the same way ADR-0004/0005 did — read from the shipped
  code, file+line citations for every claim. Resolved `docs/product/DOMAIN_MODEL.md`'s Open
  Question of Product Role → AI Expert mapping **for Reader** (now 1:1 to the Reader Expert,
  alongside Critic) — Co-author/Editor remain unresolved, explicitly not addressed.

Two unrelated, ad-hoc queue tasks were also processed during this sprint window but are not
Sprint 09 steps: adding `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` (Product Owner's
book-level assistants/unified-view/context-model vision — explicitly not implemented this
sprint) and renaming the development-process "AI Bus" (`docs/ai-bus/` → `docs/task-bus/`) to
stop it colliding in name with the product's own `apps/studio/src/ai/aiBus.ts` — both
documentation-only, tracked in `docs/task-bus/queue/done/`.

## Out of Scope (held constant this sprint)

- Co-author and Editor as separate, distinct AI Experts — they still call the Line Editor
  Expert under different labels; not changed by this sprint.
- Multiple named Reader instances (3–4, per the original MVP Scope and
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 7) — a single generic Reader only.
- Localization of Line Editor's and Critic's prompts to Russian — separately planned for
  Sprint 14.
- Sprint 10 — not started, no scope defined.

## Tasks (Development Strategy)

- [x] **Step 01 — Backend `/api/reader` (discovery implementation).** Committed `5418ff3`.
- [x] **Step 02 — AI Bus dispatch for `reader_reaction`.** Committed `bb9df12`.
- [x] **Step 03 — Wire Reader through AI Bus.** Committed `6ad8aac`.
- [x] **Step 04 — ADR-0006 (Reader Expert Contract) + Sprint closeout.** Documentation only.

## Definition of Done

- Each step validated by `npm run build`, `npm run lint`, grep-based scope verification, and
  (for code steps) live verification against a running server — met for Steps 01–03.
- No step changed `/api/line-editor`'s or `/api/critic`'s contract, or Co-author/Editor's
  existing behavior — met.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit —
  met for all four steps.

## Completed

- Step 01: ARP approved (`STATUS: OK`), committed `5418ff3`.
- Step 02: ARP approved (`STATUS: OK`), committed `bb9df12`.
- Step 03: ARP approved (`STATUS: OK`, with the same accepted browser-automation limitation as
  Sprint 08's Critic UI steps), committed `6ad8aac`.
- Step 04: ADR-0006 and DOMAIN_MODEL.md update — this step.

## Known Open Items (carried forward, not part of Sprint 09 scope)

- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`. Still not addressed.
- Co-author and Editor → AI Expert mapping remains unresolved
  (`docs/product/DOMAIN_MODEL.md`'s Open Questions, resolved this sprint only for Reader).
- `AIResponse`/`AppliedAIResponse` still shaped around a single text result; Critic's
  `reviews` still travels as a JSON string, not a typed structure (tracked in ADR-0005's Known
  Gaps, unaffected by this sprint).
- Line Editor's and Critic's prompts remain unlocalized (English, no Russian instruction) —
  planned for Sprint 14.
- Multiple named Reader instances, per
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 7 — not implemented, future work.
- No browser automation tool is available in this environment — every UI step's live
  verification since Sprint 05 has relied on build/lint/code review plus backend-level
  `curl`/direct-`aiBus.execute()` checks, not actual click-through testing. Recorded again here
  as a standing, unresolved environment limitation, not specific to this sprint.

## Next Action

Sprint 10 has not been started and has no defined scope. Scoping it is a Product Owner /
Architect decision, not yet made.
