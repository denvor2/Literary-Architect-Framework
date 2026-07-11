# Sprint-27-Step-01: Environment documentation

id: Sprint-27-Step-01
name: Environment documentation
type: documentation

scope:
  allowed_paths:
    - apps/studio/.env.example
    - README.md
    - docs/project/DEPLOYMENT.md
  forbidden_paths:
    - apps/studio/src/**
    - apps/studio/prisma/**
    - docker-compose.yml
    - docker-compose.prod.yml

objective: Document all environment variables required for production deployment, with examples and quick-reference guides for local/Docker/production scenarios.

inputs:
  - ROADMAP_18-27.md (Sprint 27 definition)
  - ADR-0012 (Persistence Migration, mentions backup requirement)

outputs:
  - Updated .env.example with all 8+ variables documented
  - New "Development & Deployment" section in README.md
  - Enhanced docs/project/DEPLOYMENT.md with environment configuration

validation:
  - npm run build succeeds (tsc, eslint, prettier all clean)
  - .env.example contains ANTHROPIC_API_KEY, DATABASE_URL, NODE_ENV, PORT, HOSTNAME, RATE_LIMIT_ENABLED, RATE_LIMIT_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS with descriptions
  - README.md has new "Development & Deployment" section
  - DEPLOYMENT.md updated with clear required/optional variable breakdown

done_when:
  - ARP file created in docs/task-bus/queue/active/ with full validation logs
  - All tsc/eslint/prettier/build checks pass
  - ready for architect-reviewer and tester gates
