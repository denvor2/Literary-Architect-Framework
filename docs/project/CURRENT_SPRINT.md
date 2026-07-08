# Current Sprint

**Sprint 15 — Systematic Localization** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress plus the immediately preceding sprint's closing summary (below). History for
earlier sprints lives in `docs/reports/SPRINT_06_REPORT.md` and this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.**

- **Status:** In progress. Not yet started at code level.
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/vision/SPRINT_ROADMAP.md` (Sprint 15 row: "Локализация систематически
  (промпты + вся UI)") + `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 6.

## Sprint 14 — closed

Delivered Reader's multiple named instances end to end, resolving a real gap Sprint 13 left
open (Critic/Reader's `createThread`/"Начать заново" only ever exposed the *last* thread — not
what Product Owner asked for: separate, comparable, persona'd instances).

- **Step 01 (plumbing)** — `AssistantThread` gained an optional `persona` field (meaningful only
  for Reader); `/api/reader` folds it into the system prompt when present (absent = byte-
  identical to before); `reader_reaction`'s AI Bus payload carries it through;
  `useWorkspaceController.ts` gained `renameThread`/`deleteThread` and generalized
  `appendMessage`/`createThread` to target/create a specific thread instead of always the last
  one. Live-verified: the same scene text with two different personas ("десятилетний ребёнок" vs
  "суровый литературный критик") produced genuinely different reactions, not a cosmetic label.
  Committed `e41793e`.
- **Step 02 (UI)** — `AssistantPanel.tsx`'s Reader mode got a distinct sub-UI (`ReaderPanel`):
  named instance chips (create with name+persona, rename, delete), single-view tab switching,
  and a side-by-side compare grid for 2+ selected instances (read-only in this first version —
  sending stays single-view only, an explicit, Step-Card-recorded simplification). Co-author/
  Editor/Critic rendering unchanged. Live-verified end to end against a real server: two named
  instances with different personas, same input text, genuinely different real Claude responses,
  threads not cross-contaminated. Committed `49f27ca`.
- **Step 03 (this step)** — [ADR-0006](../adr/ADR-0006-reader-expert-contract.md) revised (not
  superseded) to record `persona` and the multi-instance mechanism, with an honest note that the
  ADR's Request/Response Schema section still describes the pre-Sprint-13 `{ text }` shape (never
  folded back in — a separate task if/when needed, not attempted here). No new ADR — same
  revision-not-supersession principle as ADR-0004's Sprint 12 `bookContext` addition.

**Process note carried through this sprint:** this project worked without a separate Architect
session throughout Sprint 14 — the Programmer (Executor) role wrote its own Step Cards, Product
Owner reviewed and confirmed each one directly before commit.

## Sprint 15 — Goal

**Systematic localization**, scoped narrowly (not the full product-wide localization pass,
which remains Sprint 30-40 per vision document Section 6):

1. Line Editor's and Critic's system prompts still carry no Russian instruction (English-only,
   unchanged since their original discovery implementations — Sprint 04/08). Reader and
   Co-author already do (Sprint 09/12).
2. Remaining English UI copy — reduced by Sprint 13 Step 05's removal of `MODE_INFO`'s
   perception layer, but not audited yet for what's left (error messages, placeholders, button
   labels across `EditorArea.tsx`, `AssistantPanel.tsx`, and elsewhere).

Not yet scoped into Step Cards.

## Out of Scope (held constant this sprint)

- Everything already recorded as out of scope in prior sprints (Book Series, Trash/Archive,
  ЛитРес genre-list integration, export/import formats, AI provider/model selection, the full
  "unified book view" redesign, Critic's thematic subcategories) — see
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Sections 1, 2, 7, 8, 9, 11, 12, 14.
- Full product-wide localization (Sprint 30-40) — this sprint is exactly the two items above,
  not a general pass.

## Tasks (Development Strategy)

Not yet scoped into Step Cards.

## Known Open Items (carried forward)

- Sprint 15's two Goal items — not yet scoped into Step Cards.
- Book Series and the full unified-book-view redesign remain vision-only ideas — not designed,
  not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`.
- [ADR-0006](../adr/ADR-0006-reader-expert-contract.md)'s Request/Response Schema section still
  describes the pre-Sprint-13 request shape (`{ text }`, not `{ sceneText, messages }`) — never
  folded back in when Sprint 13 Step 02 changed it. Not blocking, but a known staleness.
- No browser automation tool is available in this environment — UI steps' live verification
  relies on build/lint/code review plus, where possible, direct execution of compiled logic
  against a running server or pure-function scripts, not actual click-through testing.
- This project is currently working without a separate Architect session — the Product Owner
  reviews directly (see `docs/project/HANDOVER.md`).

## Next Action

Scope Sprint 15's two Goal items into Step Cards — both are well-defined (no design ambiguity
like Sprint 14's Reader multi-instance UX needed), ready to implement directly.
