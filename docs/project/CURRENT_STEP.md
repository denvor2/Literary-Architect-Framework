# Current Step

This file tracks the single active Step Card under the Task Bus execution model — see
[docs/task-bus/TASK_BUS_V4.md](../task-bus/TASK_BUS_V4.md) for the flow and
[docs/task-bus/STEP_CARD_TEMPLATE.yml](../task-bus/STEP_CARD_TEMPLATE.yml) for the schema.

Unlike `CURRENT_SPRINT.md` (updated only when a sprint closes), this file is updated on every
Step Card that closes via `REVIEW` `STATUS: OK` — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/` for why. It always reflects the last completed step, even mid-sprint.

```yaml
id: Sprint-19-Step-04
status: done
next: []
```

## Sprint 19 — Critic Subcategories (closed)

All four steps implemented and validated:

- **Step 01** — ADR-0009 accepted: four thematic lenses (continuity/fact/developmental/style),
  optional `subcategory` in request body, system prompt suffix mechanism, backward compatible.
- **Step 02** — `/api/critic` accepts optional `subcategory`; `CRITIC_SUBCATEGORY_PROMPTS` map
  provides per-lens prompt suffixes; base prompt extracted to constant.
- **Step 03** — `critic_review` operation gaining optional `subcategory`; `aiBus.execute()`
  forwards it to the route.
- **Step 04** — Pill-button selector in AssistantPanel Critic mode (Все/Связность/
  Достоверность/Развитие/Стиль); state is ephemeral, does not reset thread on switch.

Validation: `tsc`, `eslint`, `build`, 12/12 Playwright E2E tests — all green.
