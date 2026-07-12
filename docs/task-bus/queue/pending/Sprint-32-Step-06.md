id: Sprint-32-Step-06
name: "Archive автоматизация: Cron job для архивирования старых логов"
type: implementation

## Контекст

Steps 02-05 создали Event таблицу, repository, интегрировали логирование, и API endpoints.
Теперь нужна автоматизация: cron job, который ежедневно архивирует старые логи из Event
в EventArchive и удаляет очень старые события.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/jobs/auditArchiveJob.ts (новый файл — logic для архивирования + compression)
- apps/studio/src/app/api/cron/archive-events/route.ts (новый endpoint для cron trigger)
- apps/studio/src/lib/archiveCompression.ts (новый файл — логика сжатия архива)
- apps/studio/next.config.js (если нужна integratedCron конфигурация)
- .env.local (если добавлять EVENT_HOT_RETENTION_DAYS, EVENT_ARCHIVE_RETENTION_DAYS)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (только читать)
- apps/studio/src/app/api/audit/** (это Step-05)
- Любой UI-код

## Rules

### Compression Strategy

Создать файл `lib/archiveCompression.ts`:

```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Export archived events to compressed file (optional for backup/analytics)
 * Can be run as part of archive cycle or separately
 */
export async function exportAndCompressArchive(
  startDate: Date,
  endDate: Date
): Promise<{ filePath: string; sizeBytes: number }> {
  // Option 1: Export via pg_dump subset
  // pg_dump -Fc literary_studio -t event_archive --where "createdAt BETWEEN $1 AND $2" > backup.sql.gz
  
  // Option 2: Use pg_dump for full periodic backup
  const timestamp = endDate.toISOString().split('T')[0];
  const backupFile = `/backups/audit_archive_${timestamp}.sql.gz`;
  
  // Execute: pg_dump literary_studio | gzip > /backups/...
  // Store in S3 or local filesystem depending on deployment
  
  return { filePath: backupFile, sizeBytes: 0 }; // stub
}

/**
 * Optional: Compress EventArchive table directly (pg_dump compression)
 * This is metadata-only compression, not data archiving
 */
export async function analyzeArchiveSize(): Promise<{
  hotTableSize: string;
  archiveTableSize: string;
}> {
  // SELECT pg_size_pretty(pg_total_relation_size('event'));
  // SELECT pg_size_pretty(pg_total_relation_size('event_archive'));
  return { hotTableSize: "0", archiveTableSize: "0" };
}
```

**Compression options:**
- `ENABLE_ARCHIVE_EXPORT=true` — экспортировать archive в .sql.gz файл (для backup/analytics)
- `ARCHIVE_EXPORT_PATH=/backups/` — где сохранять экспорты (default: /backups/)
- `ARCHIVE_EXPORT_S3_BUCKET=...` — опционально: загружать в S3 вместо filesystem

---

1. **Новый файл src/jobs/auditArchiveJob.ts:**

```typescript
import { auditRepository } from "@/repositories";

export const EVENT_HOT_RETENTION_DAYS = parseInt(
  process.env.EVENT_HOT_RETENTION_DAYS || "30",
  10
);
export const EVENT_ARCHIVE_RETENTION_DAYS = parseInt(
  process.env.EVENT_ARCHIVE_RETENTION_DAYS || "730",
  10
);

/**
 * Запустить full archive cycle:
 * 1. Переместить события из Event в EventArchive (старше EVENT_HOT_RETENTION_DAYS)
 * 2. Удалить события из EventArchive (старше EVENT_ARCHIVE_RETENTION_DAYS)
 */
export async function runAuditArchiveCycle(): Promise<{
  movedCount: number;
  deletedCount: number;
}> {
  console.log("[AuditArchiveJob] Starting audit archive cycle...");

  try {
    // Step 1: Archive old events from hot to archive
    const { movedCount } = await auditRepository.archiveOldEvents(
      EVENT_HOT_RETENTION_DAYS
    );
    console.log(
      `[AuditArchiveJob] Moved ${movedCount} events to archive.`
    );

    // Step 2: Delete very old events from archive
    const { deletedCount } = await auditRepository.deleteArchivedEvents(
      EVENT_ARCHIVE_RETENTION_DAYS
    );
    console.log(
      `[AuditArchiveJob] Deleted ${deletedCount} old archived events.`
    );

    // Step 3: Log the cycle in audit trail itself (meta!)
    // (Optional: можно логировать сам fact архивирования, но нужна осторожность с рекурсией)

    console.log("[AuditArchiveJob] Archive cycle completed successfully.");
    return { movedCount, deletedCount };
  } catch (error) {
    console.error("[AuditArchiveJob] Error during archive cycle:", error);
    throw error;
  }
}
```

2. **Endpoint для запуска cron job: POST /api/cron/archive-events**

```typescript
// apps/studio/src/app/api/cron/archive-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { runAuditArchiveCycle } from "@/jobs/auditArchiveJob";

/**
 * Endpoint для запуска archiving cycle.
 * Может быть вызван:
 * - Vercel Cron (встроенный в Next.js)
 * - External scheduler (cron-job.org, etc.)
 * - Manual trigger для тестирования
 */
export async function POST(request: NextRequest) {
  // Phase 1: Опциональная валидация secret header (может быть добавлена в Phase 2)
  // const secret = request.headers.get("X-Archive-Secret");
  // if (secret !== process.env.ARCHIVE_SECRET) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    const result = await runAuditArchiveCycle();

    return NextResponse.json(
      {
        success: true,
        message: "Archive cycle completed",
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[Archive Endpoint] Error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Archive cycle failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
```

3. **Scheduling options (Phase 1):**

**Option A: Vercel Cron (if deployed on Vercel)**

В файле next.config.js или vercel.json:
```json
{
  "crons": [
    {
      "path": "/api/cron/archive-events",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Запускает job каждый день в 00:00 UTC.

**Option B: External scheduler (if not on Vercel)**

Использовать сервис типа cron-job.org:
- URL: https://yourdomain.com/api/cron/archive-events
- Frequency: daily at 00:00 UTC
- Method: POST

**Option C: Node-cron (in-process, Phase 1 fallback)**

Если нужна встроенная cron (не рекомендуется для production):
```typescript
import cron from "node-cron";
import { runAuditArchiveCycle } from "@/jobs/auditArchiveJob";

// In app initialization (server.ts or similar):
cron.schedule("0 0 * * *", async () => {
  console.log("[Cron] Running audit archive job...");
  try {
    await runAuditArchiveCycle();
  } catch (error) {
    console.error("[Cron] Archive job failed:", error);
  }
});
```

**Рекомендация:** Option A (Vercel Cron) если на Vercel, иначе Option B (external).
Phase 1: просто создать endpoint и документировать, что его нужно вызывать из scheduler'а.

4. **Environment variables:**

Добавить в .env.local (если нужны custom retention periods):
```
# Event hot storage retention (days before archiving)
EVENT_HOT_RETENTION_DAYS=30

# Event archive retention (days before permanent deletion)
EVENT_ARCHIVE_RETENTION_DAYS=730
```

5. **Monitoring и alerting (Phase 2):**

Рекомендации:
- Логировать результат каждого cron run
- Если job выбросит ошибку, логировать в error tracking (Sentry, etc.)
- Мониторить размер Event таблицы (если растёт слишком быстро, увеличить retention)

## Validation

Все команды из apps/studio/:

1. **Типы:**
```bash
npx tsc --noEmit
```
- Никаких ошибок в auditArchiveJob.ts и route.ts

2. **Linting:**
```bash
npx eslint src/jobs/auditArchiveJob.ts src/app/api/cron/archive-events/
```
- Никаких ошибок

3. **Build:**
```bash
npm run build
```
- Успешный билд

4. **Ручное тестирование (если есть postgres с событиями):**

```bash
# Создать тестовое событие старше 30 дней
psql literary_studio << SQL
  INSERT INTO "Event" ("id", "userId", "eventType", "metadata", "createdAt", "updatedAt")
  VALUES (
    'evt_old_123',
    'user_1',
    'login_success',
    '{"email":"test@example.com"}',
    now() - interval '35 days',
    now() - interval '35 days'
  );
SQL

# Проверить Event таблица (должна быть 1 событие)
psql literary_studio -c "SELECT COUNT(*) FROM \"Event\";"

# Вызвать архивирование
curl -X POST http://localhost:3000/api/cron/archive-events

# Проверить результаты
psql literary_studio -c "SELECT COUNT(*) FROM \"Event\";"  # должно быть 0 (перемещено)
psql literary_studio -c "SELECT COUNT(*) FROM \"EventArchive\";"  # должно быть 1 (архивировано)
```

5. **Проверка обработки ошибок:**

```bash
# Если отключить Postgres и вызвать endpoint:
curl -X POST http://localhost:3000/api/cron/archive-events
# Должен вернуть 500 с сообщением об ошибке
```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст auditArchiveJob.ts
2. Полный текст /api/cron/archive-events/route.ts
3. Рекомендация по scheduling (какой вариант выбран для Phase 1)
4. Если использованы environment variables: их значения
5. Результат `npx tsc --noEmit`
6. Результат `npm run build`
7. Если доступен тестовый сервер: результат ручного тестирования архивирования

## Stop Condition

Не коммитить без подтверждения Product Owner на выбор scheduling option.
