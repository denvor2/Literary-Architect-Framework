# Current Sprint

**Sprint 16-17 — Единый вид книги + дерево навигации + сворачиваемые уровни** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** In progress — Steps 01-03 implemented, validated, not yet committed (Product Owner
  review pending, per this project's Stop Condition convention).
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/vision/SPRINT_ROADMAP.md` (Sprint 16-17 row) +
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 2.

## Sprint 15 — closed

Delivered both of Sprint 15's Goal items: Russian-language instructions for Line Editor/Critic
(previously English-only, unlike Reader/Co-author which already had this since Sprint 09/12), and
an audit-and-translate pass over the remaining English UI copy.

- **Step 01** — Line Editor/Co-author follow responses to `bookContext.language` (not hardcoded
  Russian); Critic/Reader gained an optional `bookLanguage` request field, defaulting to Russian.
  Live-verified against a real server across three languages (English, Ukrainian, Russian
  default). Committed `fccaf41`.
- **Step 02** — audited and translated remaining English UI copy across `AssistantPanel.tsx`,
  `EditorArea.tsx`, `NewBookDialog.tsx`, `CharacterPanel.tsx`, `Sidebar.tsx`, `Header.tsx`,
  `DeveloperTools.tsx`, `LineEditorPanel.tsx`, `TestConnectionButton.tsx`, `layout.tsx`'s `lang`
  attribute — with recorded, deliberate exceptions (domain enum values, product name/tagline).
  Committed `8eeb724`.
- **Cleanup (2026-07-10, folded in after Step 02's archive)** — one English string in
  `ReaderPanel` missed by Step 02's inventory, translated; `ADR-0004` backfilled with the Step 01
  language-following revision that had been implemented but never folded into the ADR. Committed
  `c32b6ff`.

## Sprint 16-17 — Goal

**Единый вид книги + дерево навигации + сворачиваемые уровни** (see
[BOOK_LEVEL_ASSISTANTS_VISION.md](../vision/BOOK_LEVEL_ASSISTANTS_VISION.md) Section 2): replace
the three mutually exclusive editor screens (book overview / chapter overview / single-scene
editor) with one continuous, scrollable view of the whole book — every chapter's scenes shown and
editable inline — with collapse/expand at every level, and a navigation tree that scrolls to a
block instead of switching screens. The domain hierarchy (`Book → Chapter → Scene`) is unchanged;
only the display/navigation model changes. This is the largest architectural change on the
roadmap and was explicitly "not designed" beforehand — a planning pass (not just a Step Card)
preceded implementation, per this project's evolutionary-architecture principle.

- **Step 01** — book requisites block (title/genre/language/premise/tags/annotations) made
  collapsible on the book-overview screen. Smallest, isolated slice; no other screen touched.
- **Step 02** — the three-screen split removed. `EditorArea.tsx`'s `UnifiedBookView` renders every
  chapter with its scenes' text inline and editable in one scroll. `Sidebar.tsx`'s tree clicks
  became "scroll to" (`scrollIntoView` against `chapter-block-{id}`/`scene-block-{id}` element
  ids) instead of switching screens. `selectedChapterId`/`selectedSceneId` (`Workspace`, still
  persisted) no longer decide what `EditorArea` renders — they only restore scroll position and
  drive the Sidebar highlight. AssistantPanel's "current scene" context is now the scene whose
  `<textarea>` was last focused (`page.tsx`'s `focusedSceneKey` + `onSceneFocus` callback carrying
  the DOM node up, replacing the single fixed `textareaRef` attachment), falling back to the
  persisted selection right after load. `isFocusMode` now narrows the whole unified view, not one
  scene — an explicit, Step-Card-recorded simplification of its old single-scene-only meaning.
- **Step 03** — collapse/expand added at every remaining level: whole-book (hides all chapters),
  per-chapter (hides its scenes), per-scene (hides just the `<textarea>` body, title stays), and a
  per-chapter "collapse/expand all scenes of this chapter" bulk toggle. `Sidebar.tsx`'s tree gained
  a matching expand/collapse arrow per chapter, sharing the same lifted, ephemeral state
  (`page.tsx`) as `EditorArea.tsx` — not a separate copy.

**Known, honestly recorded verification gap (all three steps):** no browser automation is
available in this Windows environment (`chromium-cli`/Playwright both absent; not installed, to
avoid adding a new dependency without Product Owner approval) — the `run` skill's browser-driven
pattern assumes a Linux container this project doesn't have. Verification was `tsc --noEmit` /
`eslint` / `prettier --check` / `npm run build` (clean at every step) plus thorough code review;
for stateful screens (a book must exist in `localStorage`, which only a real browser session
creates) even a `curl`-based HTML check isn't meaningful. Not actual click-through testing — flag
this if end-to-end interactive QA is needed before this ships.

## Out of Scope (held constant this sprint)

- Everything already recorded as out of scope in prior sprints (Book Series, Trash/Archive,
  ЛитРес genre-list integration, export/import formats, AI provider/model selection, Critic's
  thematic subcategories) — see `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Sections 1, 7, 8, 9,
  11, 12, 14.
- Full product-wide localization (Sprint 30-40, renumbered from 32-42 after the 2026-07-10 roadmap
  insertions) — Sprint 15 already covered this project's narrower localization scope.
- A dedicated ADR for the unified view — per evolutionary architecture, considered only after this
  lands and is confirmed working, not designed upfront (see ADR-0002).

## Known Open Items (carried forward)

- Steps 01-03 above are implemented and validated but **not committed** — Product Owner
  confirmation pending (this project's Stop Condition convention).
- Book Series remains a vision-only idea — not designed, not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`.
- [ADR-0006](../adr/ADR-0006-reader-expert-contract.md)'s Request/Response Schema section still
  describes the pre-Sprint-13 request shape — known staleness, not blocking.
- No browser automation tool is available in this environment (see this sprint's verification gap
  above) — UI steps' live verification relies on build/lint/code review, not actual click-through
  testing.
- This project is currently working without a separate Architect session — the Product Owner
  reviews directly (see `docs/project/HANDOVER.md`).

## Next Action

Product Owner review of Steps 01-03 (code + this summary); on confirmation, commit and close
Sprint 16-17, then update `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 2's status.
