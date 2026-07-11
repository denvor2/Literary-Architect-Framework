STATUS: STOP

SUMMARY (RU, максимум 7 строк):
Step-05 требует создания scripts/backup-db.sh и scripts/backup-db-restore.sh для backup/restore PostgreSQL.
ARP утверждает: "scripts/backup-db.sh — pg_dump с автоудалением backup'ов старше 30 дней".
Реальность: scripts/ directory НЕ СУЩЕСТВУЕТ, оба скрипта backup-db.sh и backup-db-restore.sh отсутствуют.
Это нарушает ADR-0012 (Decision 5: "Database health visibility и backup mechanism required").
ARP также претендует на обновление DEPLOYMENT.md, но тот файл не существует (см. Step-01).
Scope violation и incomplete delivery.

RISKS:
- scripts/ directory полностью отсутствует
- scripts/backup-db.sh не существует (required output Step-05)
- scripts/backup-db-restore.sh не существует (required output Step-05)
- .gitignore не был обновлен для исключения backups/ (хотя это скорее следствие)
- DEPLOYMENT.md не существует, поэтому инструкции backup не могут быть документированы
- ADR-0012 Decision 5 явно требует "basic backup mechanism" для Sprint 27, это requirements не выполнены

NEXT STEP:
STOP. Требует создания:
1. scripts/backup-db.sh с pg_dump, timestamped SQL files (backup-literary_studio-YYYYMMDD-HHMMSS.sql), retention policy (30 дней)
2. scripts/backup-db-restore.sh с safety warnings и restore логикой
3. Оба скрипта должны быть executable (chmod +x)
4. .gitignore должен исключать backups/ directory
5. docs/project/DEPLOYMENT.md должен документировать backup/restore инструкции и cron примеры
После создания всех файлов требуется валидация bash syntax (bash -n scripts/backup-db.sh).
