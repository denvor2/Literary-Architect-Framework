# Sprint-27-Step-02: /api/health endpoint

id: Sprint-27-Step-02
name: /api/health endpoint
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/app/api/health/route.ts
  forbidden_paths:
    - apps/studio/src/domain/**
    - apps/studio/prisma/schema.prisma
    - docker-compose.yml
    - docker-compose.prod.yml

objective: Implement POST /api/health endpoint for container health checks and load balancer monitoring, with database connectivity verification.

inputs:
  - ROADMAP_18-27.md (Sprint 27 production hardening)
  - ADR-0012 (Database connectivity requirements)

outputs:
  - apps/studio/src/app/api/health/route.ts (new POST endpoint)

validation:
  - npm run build succeeds (tsc, eslint, prettier all clean)
  - Endpoint returns JSON: {ok: boolean, database: "connected"|"disconnected", timestamp: ISO8601, error?: string}
  - Database check via Prisma $queryRaw with 5-second timeout
  - HTTP 200 always returned (health status in json.ok, not status code)
  - No authentication required
  - Live verification: 5+ sequential POST requests all succeed with response time < 1 second

done_when:
  - ARP file created in docs/task-bus/queue/active/ with full validation logs
  - All tsc/eslint/prettier/build checks pass
  - ready for architect-reviewer and tester gates
