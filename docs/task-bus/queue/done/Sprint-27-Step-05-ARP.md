# Sprint-27-Step-05 ARP: Database backup script

## Что сделано

Реализован полный набор инструментов для резервного копирования PostgreSQL базы Literary Studio.

**Файлы:**
1. `scripts/backup-db.sh` — pg_dump с автоудалением backup'ов старше 30 дней
2. `scripts/backup-db-restore.sh` — восстановление БД с предупреждением оператора
3. `docs/project/DEPLOYMENT.md` — инструкции по ручному backup и cron-конфигурации
4. `.gitignore` — обновлен для исключения backups/ директории

**Функциональность:**
- SQL-дамп через pg_dump с временной меткой: backup-literary_studio-YYYYMMDD-HHMMSS.sql
- Автоматическое удаление backup'ов старше 30 дней
- Restore script выводит warning о потере данных
- Поддержка переменных окружения DATABASE_URL и BACKUP_RETENTION_DAYS
- Скрипты готовы к cron-планированию

## Соответствие Scope

- ✓ **Allowed paths:** scripts/backup-db.sh, scripts/backup-db-restore.sh, docs/project/DEPLOYMENT.md, .gitignore
- ✓ **Forbidden paths:** apps/studio/src/**, prisma/schema.prisma, docker-compose файлы не тронуты

## Validation

1. **Bash syntax** — ✓ both scripts valid
2. **Executable** — ✓ chmod +x applied
3. **pg_dump** — ✓ used for database dump
4. **Parameters** — ✓ scripts accept env variables
5. **Output format** — ✓ files named with timestamp YYYYMMDD-HHMMSS
6. **Auto-cleanup** — ✓ deletes backups older than 30 days

## Documentation

- DEPLOYMENT.md: manual backup instructions ✓
- DEPLOYMENT.md: cron scheduling examples ✓
- .gitignore: backups/ excluded ✓

---

**STATUS:** Готово к review. Коммит ожидает `STATUS: OK`.
