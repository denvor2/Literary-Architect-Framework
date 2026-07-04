# AI Bus v4 — Bootstrap Levels

Replaces the informal "Bootstrap Set" referenced in earlier sessions with explicit, numbered
loading levels. Every new session — a new ChatGPT (Architect) session, a new Claude (Executor)
session, or a new human contributor — must read through the level applicable to it, in order,
before beginning work.

This document is an index into existing files. It does not restate their content, to avoid the
AI Bus Documentation Fragmentation risk registered in [AI_BUS_V4.md](AI_BUS_V4.md).

## Levels

**Level 0 — Orientation**
- `README.md`

**Level 1 — Project Identity**
- `docs/project/PROJECT_CHARTER.md`
- `docs/project/PROJECT_STATE.md`

**Level 2 — Current Work**
- `docs/project/CURRENT_SPRINT.md`
- `docs/project/CURRENT_STEP.md`

**Level 3 — Ratified Decisions**
- All Accepted ADRs under `docs/adr/`

**Level 4 — Operating Protocol**
- `docs/ai-bus/AI_BUS_V4.md` (canonical protocol)
- `docs/ai-bus/BRIDGE.md`, `EXECUTION_LOG.md`, `EXECUTION_ALIGNMENT.md`, `EXECUTION_CLOSURE.md`
- `docs/ai-bus/STEP_CARD_TEMPLATE.yml`, `PROMPT_TEMPLATE.md`, `REVIEW_FORMAT.md`

## Role Notes

- **Claude (Executor):** `CLAUDE.md` is auto-loaded at session start and functions as Level 0
  for Claude specifically; `docs/project/HANDOVER.md` covers Levels 0–2 in onboarding form.
  Reading `HANDOVER.md` satisfies Levels 0–2 for a new Claude session.
- **ChatGPT (Architect):** no auto-loaded file exists; a new Architect session must read
  Levels 0–4 explicitly, in order.
- **Human contributor:** `README.md` → `PROJECT_CHARTER.md` → `DEVELOPMENT_WORKFLOW.md` →
  `PROJECT_STATE.md` is sufficient (Levels 0–2, plus the workflow description); Levels 3–4
  are reference material, not required reading to start.

## Bootstrap Confirmation

Before beginning work, a new session must state that its applicable levels have been read —
e.g. "Bootstrap confirmed: Levels 0–4 read" for an Architect or Executor session. This mirrors
the target/type/scope self-declaration already required at the start of every task (see
`AI_BUS_V4.md`). A session that has not confirmed its bootstrap should not be treated as having
sufficient context to execute or review work.
