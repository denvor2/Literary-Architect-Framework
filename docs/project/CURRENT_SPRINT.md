# Current Sprint

**Sprint 10 — Characters + Chapter/Scene parity** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/08/09 lives in `docs/reports/SPRINT_06_REPORT.md` /
this file's own git history; Sprint 10 has no separate closeout report at this time.

- **Status:** Closed. Actual scope grew well beyond the two steps originally planned — see
  Summary below for the full, honest account.
- **Phase:** Phase 1 (MVP)
- **Sprint 11:** Not started yet. Scoped as multi-book support (see Next Action) — elevated
  above the previously-planned Co-author work due to a data-loss risk discovered during this
  sprint's live testing.
- **No ADR produced this sprint** — Sprint 10 was a pure domain-model/UI extension (Character,
  Chapter.subtitle), with no new AI Expert and no AI Bus change. ADR-0004/0005/0006 remain the
  complete set of Expert Contract ADRs; this is not an oversight.

## Goal

Give Characters the same first-class treatment Scenes/Chapters already had, and — once real
usage exposed gaps — bring Chapter and Scene up to the same level of completeness (editable
metadata, auto-selection on creation, navigation).

## Summary

Actual delivered scope, by real commits, not just by original Step numbering:

- **Character** — new domain entity (`id`, `name`, `description`, `notes`, `photoUrl`), its own
  editing panel (`CharacterPanel.tsx`), auto-selected on creation, autofocus on the Name field,
  a red-accented delete button (per `UI_STYLE_GUIDE.md`'s destructive-action convention).
- **Chapter** — gained a `subtitle` field, its own editing panel (Title/Subtitle, shown when a
  Chapter is selected but no Scene), auto-selected on creation, a per-chapter "+ New Scene"
  button in the Sidebar.
- **Scene** — editable title (separate from its text content — a navigation label, not
  manuscript content), auto-selected on creation (including when created from the Sidebar for a
  chapter other than the currently-selected one), Enter in the title field moves focus straight
  to the text editor.
- **Navigation** — a way back to the book overview from the Sidebar (clicking the book title);
  creation buttons for Book/Chapter/Scene/Character unified into one consistent location and
  visual style (outlined buttons, per the new Style Guide) instead of scattered text-links or a
  Header button.
- **`docs/design/UI_STYLE_GUIDE.md`** (new) — button and color-semantics conventions (bordered/
  filled buttons only, red for destructive actions), applied retroactively to every button
  touched this sprint, including ones from earlier sprints (e.g. "+ New Character").
- **Two real bugs found and fixed during this window:**
  - Scene highlight collision — Scenes are numbered per-chapter, so two chapters' first scenes
    both had `id: "1"`; the Sidebar's highlight condition didn't check `chapterId`, so both lit
    up at once. Fixed by adding the chapter check.
  - Controlled/uncontrolled input warnings on data saved before this sprint — both at the
    `Workspace` level (missing `characters`/`selectedCharacterId`) and, later, inside a nested
    `Chapter` object (missing `subtitle`). Fixed with a top-level merge in `loadWorkspace()` and
    a point-fix (`?? ""`) at the one affected input.
- **`Suppress-Extension-Hydration-Warning`** — unrelated to this sprint's topic, but processed
  in this same window: suppresses a benign Next.js hydration warning caused by browser
  extensions injecting `<html>` attributes before React hydrates.

## Out of Scope (held constant this sprint, or newly discovered and deferred)

- **Multi-book support** — discovered as a real risk during this sprint's live testing:
  creating a new book via the dialog completely replaces the previous one, with no way back.
  Not fixed here — elevated to Sprint 11 (see Next Action), not silently patched under Sprint
  10's scope.
- AI assistants operating on the Character/Chapter forms themselves (e.g., an AI-assisted
  character bio) — not requested, not attempted.
- Trash/Archive (undo for deletions) — captured as an idea in
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 9, explicitly not designed or
  implemented this sprint.
- Book series (books sharing Characters/context) — captured as an idea in
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 8, explicitly not designed or
  implemented this sprint.
- Co-author/Editor → AI Expert mapping — still unresolved, unrelated to this sprint (Sprint 10
  added no AI Expert work at all).

## Tasks (Development Strategy)

- [x] **Step 01 — Character domain entity + storage + mutations.** Committed `0e0668c`.
- [x] **Step 02 — Characters UI (Sidebar + CharacterPanel).** Committed `2a0107b`.
- [x] **Fix — Suppress-Extension-Hydration-Warning** (unrelated, processed in-window).
  Committed `a280be4`.
- [x] **Fix — merge loaded workspace over defaults** (missing `characters` on old saved data).
  Committed `7a11708`.
- [x] **Step 03 — character auto-select, name autofocus, `photoUrl` field, red delete button.**
  Committed `03f0b0e`.
- [x] **Add-UI-Style-Guide** — `docs/design/UI_STYLE_GUIDE.md` + "+ New Character" restyle.
  Committed `53de115`.
- [x] **Step 04 — back-to-book navigation, `createChapter`, move "New Book" into Sidebar, remove
  dead button.** Committed `d4c7172`.
- [x] **Fix — scene highlight collision** across chapters with colliding Scene ids. Committed
  `0cfbd80`.
- [x] **Step 05 — chapter auto-select, title/subtitle editing, per-chapter "New Scene" button.**
  Committed `3b62f5f`.
- [x] **Fix — chapter `subtitle` undefined on pre-Step-05 data** (controlled/uncontrolled input
  warning). Committed `ade779d`.
- [x] **Step 06 — scene auto-select, editable scene title.** Committed `3159229`.
- [x] **Fix — Enter in scene title moves focus to scene text.** Committed `3fae27f`.
- [x] **Add-Series-Vision-Note** and **Add-Trash-Archive-Vision-Note** — vision-document
  additions (Sections 8–9), not implementation.
- [x] **Sprint-10-Close** — this closure step. Documentation only.

## Definition of Done

- Each code step validated by `npm run build`, `npm run lint`, `npx prettier --check`, and
  grep-based scope verification — met for all steps.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit — met
  for every step, including two FIX-then-OK cycles (a corrupted-emoji encoding issue in
  `UI_STYLE_GUIDE.md`, resolved by removing the emoji) and one explicitly-flagged, explicitly-
  approved deviation from a Step Card's literal Allowed paths (Sprint-10-Step-06's `page.tsx`
  wiring, required by the Step Card's own Objective text but omitted from its Allowed paths
  list — confirmed by the Architect as an oversight in the card, not a boundary violation).
- Product Owner performed live browser verification for the UI-facing steps, compensating for
  this environment's standing lack of browser automation.

## Completed

All items in Tasks above are committed and archived to `docs/task-bus/queue/done/`.

## Known Open Items (carried forward, not part of Sprint 10 scope)

- **Multi-book support is missing and creating a new book destroys the previous one** — the
  reason Sprint 11 is scoped the way it is (see Next Action). This is the most significant open
  item coming out of this sprint.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`. Still not addressed.
- Co-author and Editor → AI Expert mapping remains unresolved (`docs/product/DOMAIN_MODEL.md`'s
  Open Questions) — untouched by Sprint 10, which added no AI Expert work.
- Trash/Archive and Book Series remain vision-only ideas
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Sections 8–9) — not designed, not scheduled.
- Line Editor's and Critic's prompts remain unlocalized (English, no Russian instruction) —
  planned for Sprint 14.
- No browser automation tool is available in this environment — every UI step's live
  verification since Sprint 05 has relied on build/lint/code review plus, where possible, direct
  execution of the real compiled logic against simulated data (e.g. `loadWorkspace()` against a
  mocked `localStorage`), not actual click-through testing. The Product Owner performed the
  actual browser verification for this sprint's UI steps. Recorded again here as a standing,
  unresolved environment limitation.

## Next Action

**Sprint 11 — multi-book support.** Prioritized by the Product Owner above the previously-
planned Co-author work, because of the data-loss risk discovered during this sprint's live
testing (creating a new book silently replaces the previous one with no recovery path). Scope
has not yet been broken into Step Cards — that is a Product Owner / Architect planning pass, not
yet done.
