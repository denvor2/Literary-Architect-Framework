# Current Sprint

**Sprint 08 — Second AI Expert: Critic** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/07 lives in `docs/reports/SPRINT_06_REPORT.md` and
this file's own git history; Sprint 08 has no separate closeout report at this time.

- **Status:** Closed. All five steps completed, validated, and committed.
- **Phase:** Phase 1 (MVP)
- **Sprint 09:** Not started. No scope has been defined yet.

## Goal

Build and ratify the project's second AI Expert — Critic — end to end: backend route, AI Bus
dispatch, UI wiring, responsive presentation, and a contract ADR — now that
[ADR-0004](../adr/ADR-0004-expert-contract-specification.md) (Sprint 07) unblocked a second
Expert.

## Summary

- **Step 01 — Backend `/api/critic`.** Discovery implementation mirroring
  `/api/line-editor`'s shape: `POST { text }` → `{ ok: true, reviews: [{ category, severity,
  comment }] }` or `{ ok: false, error }`. Fixed model/prompt, same error-code pattern as Line
  Editor, plus a Critic-specific "not valid JSON" failure mode.
- **Step 02 — AI Bus real dispatch.** `AIOperation` gained its first-ever second variant
  (`critic_review`); `aiBus.execute()` now genuinely branches on `operation.type` instead of
  only reading it decoratively. `improve_text` behavior unchanged (verified byte-for-byte).
  `AIResponse.text` temporarily carries `JSON.stringify(reviews)` — explicit `TODO`, not
  resolved this sprint.
- **Step 03 — UI wiring.** Critic mode in `EditorArea.tsx` calls `critic_review` via a new
  `handleCritic()`, separate from the shared `handleImprove()` used by Co-author/Editor/Reader.
  Added text-selection capture (`getSelectedText()`, selection or whole-scene fallback).
  Critic's result renders as a Review (no "Заменить текст" — matches the Review vs. Revision
  distinction from `docs/product/DOMAIN_MODEL.md`/ADR-0004).
- **Step 04 — Responsive review panel.** Critic's findings render as styled cards
  (category/severity badges, muted tones) in a container that stacks below `1024px` and sits
  beside the reviewed text at `1024px` and above — pure CSS (Tailwind `lg:` breakpoint), no JS
  width detection.
- **Step 05 — [ADR-0005](../adr/ADR-0005-critic-expert-contract.md) + Sprint closeout.**
  Ratified the Critic Expert contract the same way ADR-0004 ratified Line Editor's — read from
  the shipped code, file+line citations for every claim. Resolved
  `docs/product/DOMAIN_MODEL.md`'s Open Question of Product Role → AI Expert mapping **for
  Critic only** (now 1:1 to the Critic Expert) — Co-author/Editor/Reader remain unresolved,
  explicitly not addressed.

Two unrelated, ad-hoc queue tasks were also processed during this sprint window but are not
Sprint 08 steps: adding `docs/project/GLOSSARY.md` and a chat-formatting note in
`docs/ai-bus/STANDING-PROMPT.md` — both documentation-only, tracked in
`docs/ai-bus/queue/done/`.

## Out of Scope (held constant this sprint)

- Co-author and Reader as separate, distinct AI Experts — they still call the Line Editor
  Expert under different labels; not changed by this sprint.
- Typed `ReviewResult` in `AIResponse`/`AppliedAIResponse` — the `JSON.stringify` TODO from
  Step 02 remains open technical debt, not resolved.
- Sprint 09 — not started, no scope defined.

## Tasks (Development Strategy)

- [x] **Step 01 — Backend `/api/critic` (discovery implementation).** Committed `4293065`.
- [x] **Step 02 — AI Bus real dispatch by `operation.type` (`critic_review`).** Committed
      `98d1783`.
- [x] **Step 03 — Wire Critic to real AI Bus call, capture text selection.** Committed
      `8b6a7d3`.
- [x] **Step 04 — Responsive Critic review panel.** Committed `f4f6b6c`.
- [x] **Step 05 — ADR-0005 (Critic Expert Contract) + Sprint closeout.** Documentation only.

## Definition of Done

- Each step validated by `npm run build`, `npm run lint`, grep-based scope verification, and
  (for code steps) live verification against a running server — met for Steps 01–04.
- No step changed `/api/line-editor`'s contract or Co-author/Editor/Reader's existing
  behavior — met.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit —
  met for all five steps.

## Completed

- Step 01: ARP approved (`STATUS: OK`), committed `4293065`.
- Step 02: ARP approved (`STATUS: OK`), committed `98d1783`.
- Step 03: ARP approved (`STATUS: OK`, with an explicitly accepted limitation — no browser
  automation available in this environment to click-test selection), committed `8b6a7d3`.
- Step 04: ARP approved (`STATUS: OK`, same browser-automation limitation accepted for the
  responsive layout), committed `f4f6b6c`.
- Step 05: ADR-0005 and DOMAIN_MODEL.md update — this step.

## Known Open Items (carried forward, not part of Sprint 08 scope)

- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`. Still not addressed.
- Co-author, Editor, and Reader → AI Expert mapping remains unresolved
  (`docs/product/DOMAIN_MODEL.md`'s Open Questions, only partially resolved this sprint for
  Critic).
- `AIResponse`/`AppliedAIResponse` still shaped around a single text result; `reviews` travels
  as a JSON string, not a typed structure (tracked in ADR-0005's Known Gaps).
- No browser automation tool is available in this environment — every UI step's live
  verification since Sprint 05 has relied on build/lint/code review plus backend-level `curl`
  checks, not actual click-through testing. Recorded again here as a standing, unresolved
  environment limitation, not specific to this sprint.

## Next Action

Sprint 09 has not been started and has no defined scope. Scoping it is a Product Owner /
Architect decision, not yet made.
