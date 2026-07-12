STATUS: FIX

SUMMARY (RU):
Реализация корректна и архитектурно согласована с ADR-0017: созданы auditArchiveJob.ts с runAuditArchiveCycle(), endpoint POST /api/cron/archive-events, compression-stubs, env vars. Scope соответствует (только allowed paths). TypeScript и ESLint проходят. Но Step Card явно требует успешный `npm run build`, а ARP показывает ошибку EBUSY (системная блокировка .next/). Хотя блокировка — ОС-проблема, а не дефект кода, валидация Step Card не завершена. Потребуется перезапуск build в чистом окружении.

RISKS:
- `npm run build` не завершен успешно (системная блокировка файла .next/standalone). Хотя TypeScript/ESLint проходят и live-verification endpoint работает, Step Card явно требует успешный build.
- Stop Condition документирован (ждём одобрения Product Owner на выбор scheduling option), но build-validation должна быть выполнена до commit.
- ARP отмечает, что file-lock не связана с кодом, но это не освобождает от выполнения Step Card требований.

NEXT STEP:
Переделать валидацию: очистить lock на .next/standalone (rm -rf apps/studio/.next/ или перезагрузить процесс) и переустановить `npm run build` до успеха. После успешной build подтвердить OK для commit. Scheduling decision (Vercel Cron vs External Scheduler) всё ещё требует Product Owner approval перед commit.
