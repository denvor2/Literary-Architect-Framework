# Sprint-27-Step-03: Rate limiting middleware

id: Sprint-27-Step-03
name: Rate limiting middleware
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/lib/rateLimit.ts
    - apps/studio/src/app/api/line-editor/route.ts
    - apps/studio/src/app/api/critic/route.ts
    - apps/studio/src/app/api/reader/route.ts
    - apps/studio/src/app/api/coauthor/route.ts
    - apps/studio/src/app/api/book-field/route.ts
    - apps/studio/.env.example
  forbidden_paths:
    - apps/studio/src/domain/**
    - apps/studio/prisma/schema.prisma
    - docker-compose.yml
    - docker-compose.prod.yml

objective: Implement in-memory rate limiting for AI API routes to protect against excessive concurrent requests during production operation.

inputs:
  - ROADMAP_18-27.md (Sprint 27 production hardening)
  - .env configuration (RATE_LIMIT_* variables)

outputs:
  - apps/studio/src/lib/rateLimit.ts (utility with 15-min sliding window, configurable limits)
  - Updated 5 AI route handlers (/line-editor, /critic, /reader, /coauthor, /book-field) to check rate limit before processing
  - Updated .env.example with RATE_LIMIT_ENABLED, RATE_LIMIT_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS

validation:
  - npm run build succeeds (tsc, eslint, prettier all clean)
  - Rate limiting configured via .env (default: 10 requests per 15-minute window)
  - Request count > limit returns HTTP 429 with {ok: false, error: "rate limit exceeded"}
  - Live verification: send 11+ sequential requests to one route, first 10 return 200, 11th returns 429

done_when:
  - ARP file created in docs/task-bus/queue/active/ with full validation logs
  - All tsc/eslint/prettier/build checks pass
  - ready for architect-reviewer and tester gates
