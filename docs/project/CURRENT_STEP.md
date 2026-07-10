# Current Step

This file tracks the single active Step Card under the Task Bus execution model — see
[docs/task-bus/TASK_BUS_V4.md](../task-bus/TASK_BUS_V4.md) for the flow and
[docs/task-bus/STEP_CARD_TEMPLATE.yml](../task-bus/STEP_CARD_TEMPLATE.yml) for the schema.

Unlike `CURRENT_SPRINT.md` (updated only when a sprint closes), this file is updated on every
Step Card that closes via `REVIEW` `STATUS: OK` — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/` for why. It always reflects the last completed step, even mid-sprint.

```yaml
id: Sprint-18-Step-03
status: done
next: []
```

## Sprint 18 — Ideas/Notes (closed)

All three steps implemented and validated:

- **Step 01** — `Idea` type added to domain model (`model.ts`); `ideas: Idea[]` added to `Book`;
  `normalizeBook()` defaults `ideas: []` for old books; `createBook` and `NewBookDialog` updated.
- **Step 02** — `IdeasPanel.tsx` component: list of notes with inline text editing, auto-timestamped
  creation, and delete with confirmation. CRUD operations (`createIdea`/`updateIdea`/`deleteIdea`)
  added to workspace controller.
- **Step 03** — `IdeasPanel` integrated into `UnifiedBookView` after the chapters section; props
  wired through `EditorArea` → `page.tsx`.

Validation: `tsc`, `eslint`, `build`, 12/12 Playwright E2E tests — all green.
