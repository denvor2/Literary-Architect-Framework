# Task Bus v4 — Bootstrap Levels

Replaces the informal "Bootstrap Set" referenced in earlier sessions with explicit, numbered
loading levels. Every new session — whoever is currently playing the Architect role, whoever
is currently playing the Programmer (Executor) role, or a new human contributor — must read
through the level applicable to it, in order, before beginning work. Architect and Programmer
(Executor) are roles, not fixed AI models — see `PROJECT_CHARTER.md`'s Role/Model Binding note.

This document is an index into existing files. It does not restate their content, to avoid the
Task Bus Documentation Fragmentation risk registered in [TASK_BUS_V4.md](TASK_BUS_V4.md).

## Levels

**Level 0 — Orientation**
- `README.md`

**Level 1 — Project Identity**
- `docs/project/PROJECT_CHARTER.md`
- `docs/project/PROJECT_STATE.md`

**Level 2 — Current Work**
- `docs/project/CURRENT_SPRINT.md`
- `docs/project/CURRENT_STEP.md`

  `CURRENT_SPRINT.md` reflects the state as of the last sprint **close** — mid-sprint, it can
  be stale by definition (it is not updated per-step, only at sprint boundaries). Check
  `CURRENT_STEP.md` (updated per-step, see its own header) and `docs/task-bus/queue/done/` for
  the true latest state. This caused real confusion at least twice in one day before being
  written down here — see `Fix-CurrentSprint-Lag` in `docs/task-bus/queue/done/`.

**Level 3 — Ratified Decisions**
- All Accepted ADRs under `docs/adr/`

**Level 4 — Operating Protocol**
- `docs/task-bus/TASK_BUS_V4.md` (canonical protocol)
- `docs/task-bus/BRIDGE.md`, `EXECUTION_LOG.md`, `EXECUTION_ALIGNMENT.md`, `EXECUTION_CLOSURE.md`
- `docs/task-bus/STEP_CARD_TEMPLATE.yml`, `PROMPT_TEMPLATE.md`, `REVIEW_FORMAT.md`

## Role Notes

- **Programmer (Executor) session:** if this role is currently played by Claude Code
  specifically, `CLAUDE.md` is auto-loaded at session start and functions as Level 0 for that
  session — a fact about that tool's bootstrap, not part of the role's definition.
  `docs/project/HANDOVER.md` covers Levels 0–2 in onboarding form regardless of which model is
  playing the role. Reading `HANDOVER.md` satisfies Levels 0–2 for a new Programmer (Executor)
  session. Before checking `docs/task-bus/queue/`, also read
  [STANDING-PROMPT.md](STANDING-PROMPT.md) — the queue pickup/ARP/Review routine.
- **Architect session:** no model-specific auto-loaded file currently exists for this role; a
  new Architect session must read Levels 0–4 explicitly, in order, regardless of which model is
  playing it.
- **Human contributor:** `README.md` → `PROJECT_CHARTER.md` → `DEVELOPMENT_WORKFLOW.md` →
  `PROJECT_STATE.md` is sufficient (Levels 0–2, plus the workflow description); Levels 3–4
  are reference material, not required reading to start.

## Bootstrap Confirmation

Before beginning work, a new session must state that its applicable levels have been read —
e.g. "Bootstrap confirmed: Levels 0–4 read" for an Architect or Executor session. This mirrors
the target/type/scope self-declaration already required at the start of every task (see
`TASK_BUS_V4.md`). A session that has not confirmed its bootstrap should not be treated as having
sufficient context to execute or review work.

## Session Refresh Trigger

A session should end and hand off to a fresh one (via Bootstrap, not via continuing in
accumulated context) when any of the following checkable facts hold — not on a subjective
sense that "this feels long":

- **A Sprint has just closed.** Its closing ARP/Sprint Report has been delivered and
  `CURRENT_SPRINT.md` reflects the closed state. This is a natural boundary already built into
  the process — the next session starts the next Sprint (or Sprint Ratification) cold, reading
  Bootstrap fresh rather than carrying the closed Sprint's accumulated back-and-forth forward.
- **Five Step Cards have been processed in the current session without a Bootstrap refresh.**
  Concrete count: 5. Rationale — this project's own history shows sessions that run past this
  point (e.g. a single session spanning all of Sprint 05, all nine Sprint 06 steps, and
  subsequent documentation/review tasks) accumulate enough prior ARPs, prior architectural
  findings, and prior corrections that a fresh session re-reading Bootstrap + the current
  `CURRENT_STEP.md`/queue state is more reliable than trusting long accumulated context to
  stay accurate. Five is chosen as smaller than what this project has already observed
  straining a single session, not as a theoretical ideal.
- **The human contributor explicitly states that response quality has degraded** (e.g.
  repeated factual errors about already-established repository state, contradicting its own
  earlier statements in the same session, or visibly losing track of scope). This is a stated
  event, not a measurement, but it is checkable: either the human said it happened or they did
  not.

When any of these hold, the session should stop taking on new Step Cards, ensure its current
ARP/queue state is committed and readable from the repository alone, and let the next session
resume via normal Bootstrap — not via being handed a summary of the old conversation.
