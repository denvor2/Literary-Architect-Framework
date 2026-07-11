# Sprint-27-Step-05: Database backup script

id: Sprint-27-Step-05
name: Database backup script
type: implementation

scope:
  allowed_paths:
    - scripts/backup-db.sh
    - scripts/backup-db-restore.sh
    - docs/project/DEPLOYMENT.md
    - .gitignore
  forbidden_paths:
    - apps/studio/src/**
    - apps/studio/prisma/schema.prisma
    - docker-compose.yml
    - docker-compose.prod.yml

objective: Implement pg_dump-based backup and restore scripts for PostgreSQL with automatic retention policy, supporting both manual execution and cron scheduling.

inputs:
  - ADR-0012 (Persistence Migration, Decision 5 mentions backup requirement)
  - ROADMAP_18-27.md (Sprint 27, backup script scheduled)

outputs:
  - scripts/backup-db.sh (pg_dump with auto-deletion of backups older than 30 days)
  - scripts/backup-db-restore.sh (restore from backup with safety warning)
  - Updated DEPLOYMENT.md with backup/restore instructions and cron setup examples
  - Updated .gitignore to exclude backups/ directory

validation:
  - Both scripts have valid bash syntax (bash -n scripts/backup-db.sh succeeds)
  - Scripts are executable (chmod +x applied)
  - Backup script creates timestamped SQL files: backup-literary_studio-YYYYMMDD-HHMMSS.sql
  - Backup script outputs file size and full path
  - Restore script includes operator warning about data loss
  - DEPLOYMENT.md contains manual backup instructions and cron scheduling examples
  - backups/ excluded from git via .gitignore

done_when:
  - ARP file created in docs/task-bus/queue/active/ with full validation logs
  - All bash scripts valid and executable
  - ready for architect-reviewer and tester gates
