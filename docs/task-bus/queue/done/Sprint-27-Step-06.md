# Sprint-27-Step-06: Prisma migration deployment docs

id: Sprint-27-Step-06
name: Prisma migration deployment docs
type: documentation

scope:
  allowed_paths:
    - docs/project/DEPLOYMENT.md
    - README.md
    - apps/studio/Dockerfile
    - apps/studio/entrypoint.sh
  forbidden_paths:
    - apps/studio/src/**
    - apps/studio/prisma/schema.prisma
    - docker-compose.yml
    - docker-compose.prod.yml

objective: Document Prisma migration deployment strategy for first deploy to empty database and subsequent deployments with accumulated migrations, and automate migration execution in Docker.

inputs:
  - ROADMAP_18-27.md (Sprint 27, migration docs requirement)
  - ADR-0012 (Persistence Migration, all migrations apply together on first deploy)
  - Prisma schema and migrations in apps/studio/prisma/

outputs:
  - New "Database Migrations" section in docs/project/DEPLOYMENT.md covering strategy, lifecycle, first deploy, and subsequent deploys
  - Updated README.md with "Production Deployment Checklist" linking to DEPLOYMENT.md
  - apps/studio/entrypoint.sh (Option A: automated) with prisma migrate deploy command
  - Updated apps/studio/Dockerfile runner stage to copy prisma/ and node_modules, use entrypoint.sh

validation:
  - npm run build succeeds (tsc, eslint, prettier all clean)
  - docker-compose -f docker-compose.prod.yml config succeeds with updated Dockerfile
  - DEPLOYMENT.md contains clear migration strategy and instructions
  - entrypoint.sh runs prisma migrate deploy before app start
  - Dockerfile ENTRYPOINT set to entrypoint.sh (not CMD)

done_when:
  - ARP file created in docs/task-bus/queue/active/ with full validation logs
  - All tsc/eslint/prettier/build checks pass
  - ready for architect-reviewer and tester gates
