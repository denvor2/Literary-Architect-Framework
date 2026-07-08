# Current Step

This file tracks the single active Step Card under the Task Bus execution model — see
[docs/task-bus/TASK_BUS_V4.md](../task-bus/TASK_BUS_V4.md) for the flow and
[docs/task-bus/STEP_CARD_TEMPLATE.yml](../task-bus/STEP_CARD_TEMPLATE.yml) for the schema.

Unlike `CURRENT_SPRINT.md` (updated only when a sprint closes), this file is updated on every
Step Card that closes via `REVIEW` `STATUS: OK` — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/` for why. It always reflects the last completed step, even mid-sprint.

```yaml
id: Sprint-14-Step-03
status: done
next: []
```
