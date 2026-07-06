# Current Sprint

**Sprint 11 — Multi-Book Workspace** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/08/09/10 lives in `docs/reports/SPRINT_06_REPORT.md` /
this file's own git history; Sprint 11 has no separate closeout report at this time.

- **Status:** Closed. All 5 planned steps plus 2 emergency fixes completed, validated, and
  committed.
- **Phase:** Phase 1 (MVP)
- **Sprint 12:** Not started. No scope has been defined yet.
- **[ADR-0007](../adr/ADR-0007-multi-book-workspace.md) ratified** this sprint — the project's
  first ADR for a domain-model/architecture change that isn't an AI Expert Contract
  (ADR-0004/0005/0006 cover those separately).

## Goal

Replace the single-book `Workspace` with a multi-book one, closing a real data-loss risk
discovered during Sprint 10: creating a new book completely replaced whatever book existed
before, with no recovery path. **The Product Owner actually lost their first book this way,
before this Sprint's migration existed** — recorded plainly, not softened.

## Summary

- **Step 01 — domain model + storage migration.** `Book` became self-contained (`chapters`/
  `characters` moved inside it, out of `Workspace`); `Workspace` became `{ books: Book[],
  activeBookId, selection fields }`; `workspaceStorage.ts` gained `migrateIfNeeded()` to detect
  and migrate the old single-book format. The riskiest step in the project so far — worked
  through it slowly, verified the migration against real mocked old-format data before moving
  on. Introduced a naming collision (`selectBook()` repurposed from Sprint 10's "return to book
  overview" to "switch active book") — caught in review, restored as `deselectAll()`.
- **Step 02 — multi-book UI.** Sidebar shows a list of books instead of one; `page.tsx` gained
  `handleSelectBook()` (click active book → `deselectAll()`, click another → `selectBook()`);
  the temporary `book` alias from Step 01 was removed, `activeBook` exported directly;
  `NewBookDialog.tsx`'s `onCreate` type fixed to match the new `Book` shape.
- **Step 03 — editable book overview.** Title/Genre/Language/Premise, previously static text in
  the book overview, became editable fields (`updateBook()`), matching the parity already given
  to Chapter/Character/Scene in Sprint 10.
- **Step 04 — Genre/Language selects everywhere + new Book fields.** Genre/Language became
  `<select>` in the overview too (previously text input there, `<select>` only in the creation
  dialog); added `tags`/`shortAnnotation`/`fullAnnotation` to `Book`. Required a flagged,
  Architect-approved touch of a Forbidden path (`workspaceStorage.ts`) to keep the Step Card's
  own "0 type errors" requirement achievable — the same class of situation as Sprint-10-Step-06.
- **Emergency fix — `normalizeBook()`.** A real crash (`book.tags.join(...)` on `undefined`, for
  books saved in the new `books[]` format but before Step 04 added the new fields) became the
  trigger for a systemic fix instead of another one-off patch: `normalizeBook()` centralizes
  defaulting for every `Book` field, applied in both `migrateIfNeeded()` branches. Third
  occurrence of this exact bug class this project (Workspace `characters`, `Chapter.subtitle`,
  now `Book` fields) — recorded in ADR-0007 as mandatory future practice.
- **Sprint-11-Step-05 (this step) — [ADR-0007](../adr/ADR-0007-multi-book-workspace.md) +
  closeout.**

## Out of Scope (held constant this sprint)

- Book Series (books sharing Characters/context) — vision document
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`) Section 8, an idea, not designed or scheduled.
- Collapsible/unified book-level view (all chapters/scenes visible at once, collapsible per
  level) — vision document Section 2's amendment, explicitly "an idea, under discussion," not a
  decision for this or any specific future sprint.
- Trash/Archive (undo for deletions) — vision document Section 9, not designed.
- Per-book selection state (remembering which chapter/scene/character was selected per book) —
  deliberately not implemented; switching books always resets selection (see ADR-0007).
- Co-author/Editor → AI Expert mapping — unrelated, untouched by this sprint.

## Tasks (Development Strategy)

- [x] **Step 01 — multi-book domain model + storage migration.** Committed `385d10e`.
- [x] **Step 02 — multi-book UI, fix NewBookDialog types, remove temporary book alias.**
  Committed `6793fa4`.
- [x] **Step 03 — editable book fields in overview.** Committed `3b96695`.
- [x] **Step 04 — Genre/Language selects, book tags/annotations.** Committed `beaab6e`.
- [x] **Fix — normalizeBook centralizes Book field defaults**, resolves `book.tags` crash on
  pre-Step-04 data. Committed `f99910c`.
- [x] **Step 05 — ADR-0007 + Sprint closeout.** Documentation only.

Two unrelated, independent vision-document additions were also processed in this window but are
not Sprint 11 steps: `Add-Deployment-Readiness-Vision-Note` (+ Amendment, sections 10–12),
`Add-Security-Strategy-Vision-Note` (section 13), and `Add-Collapsible-View-Vision-Note`
(amendment to section 2) — all documentation-only, tracked in `docs/task-bus/queue/done/`.

## Definition of Done

- Each code step validated by `npm run build`, `npm run lint`, `npx prettier --check`, and
  `npx tsc --noEmit` (this sprint's steps required 0 type errors across the whole project, not
  just the Allowed-path files, given how foundational the `Workspace` shape change was) — met
  for all steps.
- Architect Review (ARP, `STATUS: OK`) delivered and approved for each step before commit — met
  for every step, including two explicitly-flagged, explicitly-approved deviations touching
  Forbidden paths (Step 04's `workspaceStorage.ts` fix, and the emergency `normalizeBook` fix
  itself), both required to keep a Step Card's own validation criteria achievable.
- The migration's correctness against real old-format data was verified by executing the actual
  compiled `loadWorkspace()` against mocked `localStorage` snapshots — not just code review —
  for Step 01 and for the `normalizeBook` emergency fix.
- Product Owner performed live browser verification for the UI-facing steps, compensating for
  this environment's standing lack of browser automation.

## Completed

All items in Tasks above are committed and archived to `docs/task-bus/queue/done/`.

## Known Open Items (carried forward, not part of Sprint 11 scope)

- **The first book lost before this sprint's migration existed cannot be recovered.** Recorded
  permanently in ADR-0007 — this Sprint prevents recurrence, it does not undo the original loss.
- Book Series and Collapsible View remain vision-only ideas
  (`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Sections 8 and 2's amendment) — not designed,
  not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`. Still not addressed.
- Co-author and Editor → AI Expert mapping remains unresolved
  (`docs/product/DOMAIN_MODEL.md`'s Open Questions) — untouched by Sprint 11.
- Line Editor's and Critic's prompts remain unlocalized (English, no Russian instruction) —
  planned for Sprint 14.
- `normalizeBook()`'s discipline (update it whenever `Book` gains a field) is now a documented
  practice (ADR-0007) but not enforced by any automated check — relies on the Step Card/reviewer
  remembering it.
- No browser automation tool is available in this environment — every UI step's live
  verification has relied on build/lint/code review plus, where possible, direct execution of
  the real compiled logic against simulated data, not actual click-through testing. The Product
  Owner performed the actual browser verification for this sprint's UI steps. Recorded again
  here as a standing, unresolved environment limitation.

## Next Action

Sprint 12 has not been started and has no defined scope. Scoping it is a Product Owner /
Architect decision, not yet made.
