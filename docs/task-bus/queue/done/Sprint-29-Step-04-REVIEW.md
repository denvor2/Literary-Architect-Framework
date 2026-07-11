STATUS: STOP

SUMMARY (RU):
Step-04 scope соблюдён (только /api/series/route.ts), код структурно корректен (GET/POST/PUT/DELETE endpoints, валидация, обработка ошибок). Но шаг БЛОКИРОВАН Step-02 и Step-03: вызывает loadSeriesForUser/saveSeriesToUser, которые не работают без обновления schema.prisma в Step-02. Runtime-ошибки при любом запросе к /api/series до исправления upstream.

RISKS:
- **BLOCKING**: зависит от Step-03, которая зависит от Step-02 (Series model должна быть в schema.prisma)
- **Validation gap**: curl-тесты в ARP-Step-04 показывают ошибки "Cannot read properties of undefined (reading 'findMany')", что подтверждает отсутствие Series в Prisma Client

NEXT STEP:
Заблокировано до Step-02. После исправления Step-02 и валидации Step-03, перепроверить Step-04: запустить npm run build + live curl-тесты против работающего dev-сервера (без БД-ошибок).
