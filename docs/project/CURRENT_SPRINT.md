# Current Sprint

**Sprint 14 — Reader Multiple Named Instances + Systematic Localization** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/08/09/10/11/12/13 lives in
`docs/reports/SPRINT_06_REPORT.md` / this file's own git history (Sprint 13's full closing
summary is preserved in the git history of this same file, one commit before this rewrite).

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** In progress. Not yet started at code level.
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/vision/SPRINT_ROADMAP.md` (Sprint 14 row) +
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 6 (localization) and Section 7 (Reader
  multi-instance).

## Sprint 13 — closed

Delivered the unified chat mechanism for all four Product Roles end to end: `assistantThreads`
domain model + persisted assistant mode (Step 01); all four Expert routes accept client-managed
`messages` history, server stays stateless (Step 02); AI Bus operations use `sceneText` +
`messages` (Step 03); controller mutations `appendMessage`/`createThread`/`activeThreads` (Step
04); real chat UI + assistant-switcher consolidation, replacing both the old decorative
`AssistantPanel.tsx` and `EditorArea.tsx`'s one-shot `SceneImprove` (Step 05) — including
dropping the old `MODE_INFO` "perception layer" (fake scene phase/consistency, a "no memory"
disclosure that would now be literally false). Committed `f68e676`, `5c2d3e9`, `db8b510`,
`af18c4b`, `39ee241`. No new ADR — the chat mechanism is a domain-model/UI extension of the
already-ratified stateless Expert Contract (ADR-0004), not a new Expert or a new request/
response contract; nothing about it contradicts or extends what ADR-0004 already specifies.

**Finding carried forward, not resolved in Sprint 13:** Step 04/05 built `createThread` +
"Начать заново" for Critic/Reader as multiple threads with only the *last* one visible/active —
this satisfies the "reset with a fresh look" half of vision document Section 5, but Section 7's
Sprint 14 goal ("несколько именованных карточек-помощников... можно сравнивать их реакции",
Product Owner explicitly said *not* "a hidden reset button inside one Reader") wants older
Reader instances to stay visible and comparable side by side, not just replaced. Sprint 13's
UI cannot show or return to a non-active thread at all. This is real, not yet designed — Sprint
14 needs to resolve it, not just add naming.

## Sprint 14 — Goal

Two independent work areas, bundled by the roadmap into one sprint (not by any technical
dependency between them):

1. **Reader — multiple named instances.** Per vision document Section 7 and the finding above:
   distinct, comparable Reader assistants (not just resettable thread history within one
   Reader), each presumably with its own name/persona, visible/switchable independently — not
   yet designed at the UX level (open question: how are they created/named/deleted/switched
   between, and does an equivalent apply to Critic's future subcategories per Section 7 or is
   this Reader-specific for now). Needs a planning pass before implementation, same as Step 05
   needed one.
2. **Systematic localization.** Line Editor's and Critic's system prompts still carry no
   Russian instruction (English-only, unchanged since their original discovery
   implementations — Sprint 04/08). Remaining English UI copy — reduced by Step 05's removal of
   `MODE_INFO`'s perception layer, but not audited yet for what's left (error messages,
   placeholders, button labels). Full product localization remains Sprint 30-40 per the
   roadmap; this sprint's slice is specifically the two items named above, not a general pass.

## Out of Scope (held constant this sprint)

- Everything already recorded as out of scope in prior sprints (Book Series, Trash/Archive,
  ЛитРес genre-list integration, export/import formats, AI provider/model selection, the full
  "unified book view" redesign) — see `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Sections 1,
  2, 8, 9, 11, 12, 14.
- Critic's thematic subcategories (Continuity/Fact/Developmental/Style) — Section 7, but
  assigned to Sprint 18 by the roadmap, not this sprint.
- Full product localization (Sprint 30-40) — this sprint is exactly Line Editor's/Critic's
  prompts plus a scoped UI-copy audit, not a general pass.

## Tasks (Development Strategy)

Not yet scoped into Step Cards. Next Action below.

## Known Open Items (carried forward)

- Reader multi-instance design (this sprint's own Goal item 1) needs a planning pass before a
  Step Card can be written.
- Book Series and the full unified-book-view redesign remain vision-only ideas — not designed,
  not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`.
- No browser automation tool is available in this environment — UI steps' live verification
  relies on build/lint/code review plus, where possible, direct execution of compiled logic
  against a running server or pure-function scripts, not actual click-through testing.
- This project is currently working without a separate Architect session — the Product Owner
  reviews directly (see `docs/project/HANDOVER.md`).

## Next Action

Start with localization (Goal item 2, well-scoped, no design ambiguity) as Sprint-14-Step-01.
Reader multi-instance (Goal item 1) needs its own planning pass first, same as Sprint-13-Step-05
did, before it can become a Step Card.
