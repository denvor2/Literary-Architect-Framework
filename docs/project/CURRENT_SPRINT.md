# Current Sprint

**Sprint 19 — Critic subcategories (see ROADMAP_18-27.md)** — **not yet scoped**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** Not yet started — Sprint 18 is closed.
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/project/ROADMAP_18-27.md` (Sprint 19 row).

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

## Sprint 16-17 — closed

Unified book view with collapsible navigation tree — committed `62ed860`. The three-screen
split (book overview / chapter overview / single-scene editor) was replaced by a single
continuous, scrollable `UnifiedBookView` with collapse/expand at every level. Sidebar tree
clicks now scroll instead of switching screens.

- **Step 01** — book requisites block made collapsible on the book-overview screen.
- **Step 02** — three-screen split removed; `UnifiedBookView` renders every chapter with its
  scenes' text inline; sidebar tree clicks became scroll-to; `focusedSceneKey` replaced fixed
  `textareaRef` for assistant panel context.
- **Step 03** — collapse/expand at every level: whole-book, per-chapter, per-scene, and
  per-chapter bulk toggle.

**E2E testing added post-close:** Playwright smoke tests (`apps/studio/e2e/smoke.spec.ts`)
cover app load, book/chapter/scene CRUD, text editing, sidebar tree, chapter/scene collapse,
Focus Mode, and localStorage persistence — 12 tests, all green. Committed `2a28fa6`.

## Sprint 18 — closed

Ideas/Notes — free-form notes per book with auto-timestamped creation. Committed together
with Sprint 18 steps.

- **Step 01** — `Idea` type (`id`/`text`/`createdAt`) added to domain model; `ideas: Idea[]`
  added to `Book`; `normalizeBook()` defaults `ideas: []` for old books.
- **Step 02** — `IdeasPanel.tsx` component with inline text editing and delete confirmation;
  CRUD operations (`createIdea`/`updateIdea`/`deleteIdea`) in workspace controller.
- **Step 03** — IdeasPanel integrated into `UnifiedBookView` after chapters section.

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

- Book Series remains a vision-only idea — not designed, not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`.
- This project is currently working without a separate Architect session — the Product Owner
  reviews directly (see `docs/project/HANDOVER.md`).

## Next Action

Scope Sprint 19 (Critic subcategories) per `docs/project/ROADMAP_18-27.md`.
