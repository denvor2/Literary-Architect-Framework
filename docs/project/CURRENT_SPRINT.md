# Current Sprint

**Sprint 13 — Unified Chat Mechanism for All Four Product Roles** — **in progress**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History for Sprint 06/08/09/10/11/12 lives in
`docs/reports/SPRINT_06_REPORT.md` / this file's own git history.

**This file is only updated at sprint boundaries (start/close) — for the single most recently
completed Step Card, mid-sprint, see [CURRENT_STEP.md](CURRENT_STEP.md) instead; do not treat
this file alone as current mid-sprint.** (This note exists because relying on this file alone
mid-sprint caused real confusion at least twice in one day — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/`.)

- **Status:** In progress. Steps 01-04 committed and pushed to `origin/main`. Step 05 (UI
  wiring) is next, not yet started.
- **Phase:** Phase 1 (MVP)
- **Scope source:** `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, Section 15 — bundles three
  things deferred from Sprint 12: assistant-switcher UI consolidation, mode persistence (done,
  Step 01), and the Co-author/Editor/Critic/Reader chat mechanism.

## Goal

Give every Product Role (Co-author, Editor, Critic, Reader) a real, persisted message history
instead of the previous one-shot, memory-less request model — Co-author/Editor as one
continuous thread per book, Critic/Reader as zero or more user-managed named threads (see
vision document Section 5 for the per-role session model Product Owner specified).

## Summary

- **Step 01 — `assistantThreads` domain model + persisted assistant mode.** `Book` gained
  `assistantThreads: { coauthor, editor, critic, reader: AssistantThread[] }`
  (`AssistantThread = { id, name, messages: ChatMessage[] }`); `Workspace.selectedAssistantMode`
  persists the selected role across sessions (previously reset on reload).
  `normalizeBook()`/migration extended, same centralized-defaults pattern as Sprint 11's
  `Character`/`Chapter.subtitle`. Committed `f68e676`.
- **Step 02 — all four Expert routes accept `messages` history.** `/api/line-editor`,
  `/api/critic`, `/api/reader`, `/api/coauthor` all gained a required `messages: ChatMessage[]`
  field — server stays fully stateless (ADR-0004 unchanged), the client sends the whole
  conversation on every call. Committed `5c2d3e9`.
- **Step 03 — AI Bus operations use `sceneText` + `messages`.** `AIOperation`'s four variants
  renamed `text`/`currentText` → `sceneText` uniformly and each gained a required `messages`
  field, matching Step 02's route schema. `aiBus.execute()` forwards `messages` to every route.
  UI callers (`EditorArea.tsx`, `LineEditorPanel.tsx`, `NewBookDialog.tsx`) were deliberately
  left broken by this step (Forbidden path, UI is Step 05) — `npx tsc --noEmit` errors in those
  three files are expected until Step 05, not a regression. Committed `db8b510`.
- **Step 04 — controller mutations for assistant threads.** `useWorkspaceController.ts` gained
  `appendMessage(mode, message)` (appends to the active — last — thread of a role),
  `createThread(mode)` (starts a new empty thread, becomes active), and a derived
  `activeThreads` value (last thread per role). Live-verified with a pure-reducer script
  (9/9 scenarios: message lands in the correct thread, `createThread` results in
  `activeThreads` pointing at the new thread, single-thread roles behave correctly). Committed
  `af18c4b`.

## Out of Scope (held constant this sprint)

- Everything already recorded as out of scope in prior sprints and unaffected here (Book
  Series, Trash/Archive, ЛитРес genre-list integration, export/import formats, AI
  provider/model selection) — see `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Sections 1, 8,
  9, 11, 12, 14.
- Localizing remaining English UI copy (`MODE_INFO` and similar service text) and Line
  Editor's/Critic's system prompts — deferred to Sprint 14, unchanged from prior sprints.
- The full "unified book view" redesign (Section 2 of the vision document — showing the whole
  book as one scrollable document with a collapsible tree) — separate, larger, not-yet-designed
  epic; Step 05's switcher consolidation is a smaller, unrelated piece of UI.

## Tasks (Development Strategy)

- [x] **Step 01 — `assistantThreads` domain model + persisted assistant mode.** Committed
  `f68e676`.
- [x] **Step 02 — all four Expert routes accept `messages` history.** Committed `5c2d3e9`.
- [x] **Step 03 — AI Bus operations use `sceneText` + `messages`.** Committed `db8b510`.
- [x] **Step 04 — controller mutations for assistant threads.** Committed `af18c4b`.
- [ ] **Step 05 — UI wiring.** Not started. Fixes the payload-shape breakage left open by Step
  03 (`EditorArea.tsx`, `LineEditorPanel.tsx`, `NewBookDialog.tsx`) and wires the real chat
  mechanism + assistant-switcher consolidation (cards / responsive bottom list, per vision
  document Section 15) into the UI, replacing the currently-decorative, unwired
  `AssistantPanel.tsx` and the one-shot `SceneImprove` inside `EditorArea.tsx`.

Two unrelated process/documentation fixes were also processed in this window, not Sprint 13
steps: `Fix-Stale-HANDOVER`, `Add-Roadmap-And-Final-Vision-Notes`,
`Remove-Legacy-Numbered-Docs`, `Remove-Root-MASTER-Duplicate`, `Fix-CurrentSprint-Lag` (this
file) — all tracked in `docs/task-bus/queue/done/`.

## Definition of Done

- Each code step validated by `npm run build`/`npx tsc --noEmit` (where applicable given Step
  03's deliberate UI breakage), `npm run lint`, `npx prettier --check`.
- Live verification performed for every code-touching step — Steps 01-03 against a real,
  non-mocked backend/AI Bus (established scratchpad-script technique); Step 04 via a
  pure-reducer script (no server needed — the change was pure `Workspace` state transforms).
- Review before commit: Steps 01-04 were reviewed by the Architect role (`STATUS: OK`) before
  commit. Later in this same sprint window, this project transitioned to working without a
  separate Architect session — the Product Owner reviews directly instead (see
  `docs/project/HANDOVER.md` for the current state of this).

## Known Open Items (carried forward)

- Step 05 (UI wiring) — see Tasks above.
- Remaining English UI copy (`MODE_INFO` and similar), Line Editor's/Critic's unlocalized
  system prompts — Sprint 14.
- Book Series and the full unified-book-view redesign remain vision-only ideas — not designed,
  not scheduled.
- The AI Bus v5 architecture (Sprint 06) still has no ADR of its own — only described in
  `docs/reports/SPRINT_06_REPORT.md`.
- No browser automation tool is available in this environment — UI steps' live verification
  relies on build/lint/code review plus, where possible, direct execution of compiled logic
  against a running server or pure-function scripts, not actual click-through testing.

## Next Action

Step 05 (UI wiring) — scope agreed with Product Owner as a full bundle (payload-shape fixes +
real chat mechanism + switcher consolidation, not a smaller slice). Technical planning was
started, then paused to handle this file's own lag first (`Fix-CurrentSprint-Lag`) — not yet
a committed Step Card.
