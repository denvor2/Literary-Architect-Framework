# Current Sprint

**Sprint 12 — Co-author Expert + Editor Book Context** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/08/09/10/11 lives in `docs/reports/SPRINT_06_REPORT.md`
/ this file's own git history; Sprint 12 has no separate closeout report at this time.

- **Status:** Closed. All 5 planned steps plus 2 emergency fixes completed, validated, and
  committed.
- **Phase:** Phase 1 (MVP)
- **Sprint 13:** Not started. No scope has been defined yet — the vision document
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Section 15) records what is expected to move
  there (assistant-switcher UI consolidation, mode persistence, chat mechanism), but this is not
  itself a scoped Step Card.
- **[ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md) ratified** this sprint — the
  project's fourth AI Expert Contract, and the first genuinely generative one.
  **[ADR-0004](../adr/ADR-0004-expert-contract-specification.md) revised** (not superseded) —
  Line Editor's contract gained an optional `bookContext` field.

## Goal

Give Co-author (until now the one Product Role in `docs/product/DOMAIN_MODEL.md`'s Open
Questions with no grounded AI Expert mapping at all) a real, generative Expert — and let Editor
optionally see the whole book for consistency, without changing what Editor's task is.

## Summary

- **Step 01 — `/api/coauthor` discovery implementation.** New route, genuinely generative
  (writes/continues manuscript text, not a Review), the first Expert to receive the whole `Book`
  (all chapters/scenes/characters/metadata), not just the current scene. `currentText` may be
  empty (blank-page draft); `bookContext` is required. Live-verified with 4 scenarios (missing
  `bookContext` → 400; missing `currentText` → 400; empty `currentText` + realistic context →
  draft genuinely reflecting characters/premise; non-empty `currentText` → real continuation).
- **Step 02 — optional `bookContext` for `/api/line-editor`.** Backward-compatible (byte-identical
  request/response when absent); system prompt explicitly constrains `bookContext` to
  consistency only, never to rewrite or expand `text`. Live-verified: an unusual character name
  present only in context was preserved verbatim; output did not expand beyond the input's scope.
- **Step 03 — AI Bus `coauthor_draft` operation + `bookContext` passthrough.** `AIOperation`
  gained a 4th variant with a genuinely different payload shape (`{ currentText, bookContext }`
  instead of `{ text, sceneId?, chapterId? }`), which required moving the previously shared
  `const { text } = operation.payload` destructure into each branch individually. `improve_text`
  gained optional `bookContext`, forwarded unchanged to the Expert.
- **Step 04 — wire Co-author, extend Editor with book context.** `EditorArea.tsx`'s
  `handleCoauthor()` sends the whole scene text as `currentText` + `bookContext: book`, reusing
  the same generic Original/Improved preview as Editor (both produce a Revision). `handleImprove()`
  now also sends `bookContext: book`. Two additional defects were self-identified and fixed within
  this same Allowed-path file, both necessary for the Step Card's own required live-verification
  scenarios to even be possible: the shared button's `disabled` condition blocked Co-author from
  running on an empty scene (fixed to exempt Co-author from the non-empty-text requirement); a
  stale module-level comment claiming all modes call the same endpoint was corrected to reflect
  the real per-mode endpoints.
- **Emergency fix — `Fix-Assistant-Button-Label`.** Real bug from a Product Owner screenshot: the
  assistant button's label was hardcoded `"Редактор"` regardless of the selected mode. Fixed to
  read `mode`.
- **Emergency fix — `Fix-Assistant-Button-Label-Ask`.** Product Owner follow-up refinement: since
  the mode is already visible in the `<select>` above the button, showing it a second time on the
  button itself was redundant — unified to a single constant label, `"Спросить"`, regardless of
  mode.
- **Sprint-12-Step-05 (this step) — [ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md) +
  revision of [ADR-0004](../adr/ADR-0004-expert-contract-specification.md) + closeout.**

## Out of Scope (held constant this sprint)

- Assistant-switcher UI consolidation (cards + responsive bottom list) and persisting the
  selected mode across sessions — deferred to Sprint 13
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Section 15).
- Co-author/Editor chat mechanism (continuous book-level context, multi-turn) — deferred to
  Sprint 13, bundled with the switcher consolidation to avoid reworking the same UI surface
  twice.
- Localizing remaining English UI copy (`MODE_INFO` and similar service text) — deferred to
  Sprint 14.
- Everything else already recorded as out of scope in prior sprints and unaffected here (Book
  Series, Trash/Archive, collapsible unified book view, AI provider/model selection, ЛитРес
  genre-list integration, export/import formats) — see
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Sections 1, 2, 8, 9, 11, 12, 14.

## Tasks (Development Strategy)

- [x] **Step 01 — `/api/coauthor` discovery implementation.** Committed `05c820c`.
- [x] **Step 02 — optional `bookContext` for `/api/line-editor`.** Committed `4b2f7c5`.
- [x] **Step 03 — AI Bus `coauthor_draft` operation + `bookContext` passthrough.** Committed
  `5ba7929`.
- [x] **Step 04 — wire Co-author, extend Editor with book context.** Committed `bee042e`.
- [x] **Fix — assistant button label reflects selected mode.** Committed `5785ce2`.
- [x] **Fix — unify assistant button label to "Спросить".** Committed `18b4f21`.
- [x] **Step 05 — ADR-0008, ADR-0004 revision, DOMAIN_MODEL.md/vision updates, closeout.**
  Documentation only.

One unrelated, independent vision-document addition was also processed in this window but is not
a Sprint 12 step: `Add-Model-Selection-Vision-Note` (Section 14, AI provider/model selection
idea), tracked in `docs/task-bus/queue/done/`.

## Definition of Done

- Each code step validated by `npm run build`, `npm run lint`, `npx prettier --check`, and (where
  the Step Card required it) `npx tsc --noEmit` — met for all steps. One transient Google Fonts
  network failure occurred during Step 03's build (unrelated to code changes, resolved on retry),
  flagged honestly and confirmed by the Architect as not a code defect.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit — met
  for every step.
- Live verification against the real, non-mocked backend/AI Bus was performed for every
  code-touching step, using this environment's established scratchpad-script technique
  (monkey-patched `global.fetch` against a real `next start` server) to compensate for the
  standing lack of browser automation — reused consistently since Sprint 09.
- Two real UI bugs found via Product Owner screenshots during this sprint were fixed as
  out-of-queue-order emergency Step Cards, per the established `Fix-*` pattern, rather than
  silently folded into an unrelated step.

## Completed

All items in Tasks above are committed and archived to `docs/task-bus/queue/done/`.

## Known Open Items (carried forward, not part of Sprint 12 scope)

- Assistant-switcher UI consolidation and mode persistence — Sprint 13
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Sections 2–5, 15).
- Co-author/Editor chat mechanism (continuous book-level context surviving book close/reopen) —
  Sprint 13, bundled with the above.
- Remaining English UI copy (`MODE_INFO` and similar) — Sprint 14.
- Line Editor's and Critic's prompts remain unlocalized (English, no Russian instruction) — still
  planned for Sprint 14, unchanged from Sprint 11's carried-forward item.
- Book Series and Collapsible View remain vision-only ideas
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Sections 8 and 2's amendment) — not designed,
  not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`. Still not addressed.
- No browser automation tool is available in this environment — every UI step's live verification
  has relied on build/lint/code review plus, where possible, direct execution of the real
  compiled logic against a running server, not actual click-through testing. Recorded again here
  as a standing, unresolved environment limitation.

## Next Action

Sprint 13 has not been started and has no defined scope beyond the vision document's own note
that assistant-switcher consolidation and the chat mechanism should be scoped together. Scoping
it is a Product Owner / Architect decision, not yet made.
