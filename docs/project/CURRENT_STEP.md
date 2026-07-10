# Current Step

This file tracks the single active Step Card under the Task Bus execution model — see
[docs/task-bus/TASK_BUS_V4.md](../task-bus/TASK_BUS_V4.md) for the flow and
[docs/task-bus/STEP_CARD_TEMPLATE.yml](../task-bus/STEP_CARD_TEMPLATE.yml) for the schema.

Unlike `CURRENT_SPRINT.md` (updated only when a sprint closes), this file is updated on every
Step Card that closes via `REVIEW` `STATUS: OK` — see `Fix-CurrentSprint-Lag` in
`docs/task-bus/queue/done/` for why. It always reflects the last completed step, even mid-sprint.

```yaml
id: Sprint-23-Step-04
status: done
next: []
```

## Sprint 23 — PostgreSQL + Prisma (closed — pending Docker)

Steps 01, 02, 04 implemented and validated. Step 03 (`prisma migrate dev`) requires a running
PostgreSQL instance (Docker not installed on this machine).

- **Step 01** — `prisma/schema.prisma`: 8 models (User, Book, Chapter, Scene, Character, Idea,
  AssistantThread, ChatMessage) + 2 enums (AssistantRole, MessageRole). Cascade deletes,
  `@@index` on foreign keys, `order` fields for ordering.
- **Step 02** — `docker-compose.yml` updated with `postgres` service (postgres:16-alpine,
  healthcheck, named volume `pgdata`); `studio` service depends on healthy postgres.
- **Step 03** — Blocked: requires Docker. `prisma migrate dev` will run once Docker is installed.
- **Step 04** — `src/lib/db.ts`: Prisma client singleton with `@prisma/adapter-pg` (Prisma 7.x
  driver adapter pattern), global caching for dev hot-reload safety.

Prisma client generated successfully. Packages installed: `prisma` (dev), `@prisma/client`,
`@prisma/adapter-pg`, `pg`, `@types/pg` (dev), `dotenv` (dev).

Validation: `tsc`, `eslint`, `build`, 12/12 Playwright E2E tests — all green.
