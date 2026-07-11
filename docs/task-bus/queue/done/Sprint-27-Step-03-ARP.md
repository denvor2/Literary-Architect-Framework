# Sprint-27-Step-03 ARP: Rate limiting middleware

## Что сделано

Реализована система rate limiting для защиты AI-маршрутов от чрезмерной нагрузки.

**Файлы:**
1. `apps/studio/src/lib/rateLimit.ts` — утилита с in-memory Map-based хранилищем и скользящим окном
2. `apps/studio/src/app/api/line-editor/route.ts` — добавлена проверка rate limit
3. `apps/studio/src/app/api/critic/route.ts` — добавлена проверка rate limit
4. `apps/studio/src/app/api/reader/route.ts` — добавлена проверка rate limit
5. `apps/studio/src/app/api/coauthor/route.ts` — добавлена проверка rate limit
6. `apps/studio/src/app/api/book-field/route.ts` — добавлена проверка rate limit
7. `apps/studio/.env.example` — добавлены RATE_LIMIT_ENABLED, RATE_LIMIT_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW_MS

**Функциональность:**
- Скользящее окно на 15 минут (конфигурируемо через .env)
- Лимит 10 запросов/окно (конфигурируемо)
- Автоматическая очистка памяти каждую минуту
- При превышении: HTTP 429 с {ok: false, error: "rate limit exceeded"}

## Соответствие Scope

- ✓ **Allowed paths:** src/lib/rateLimit.ts, 5 API маршрутов, .env.example
- ✓ **Forbidden paths:** src/domain/**, prisma/schema.prisma, docker-compose файлы не тронуты

## Validation

1. **TypeScript** — ✓ no errors
2. **ESLint** — ✓ clean
3. **Prettier** — ✓ formatted
4. **npm run build** — ✓ successful

## Live Verification

- 11 последовательных запросов к одному маршруту ✓
- Первые 10 вернули 200 OK ✓
- 11-й вернул 429 с "rate limit exceeded" ✓

---

**STATUS:** Готово к review. Коммит ожидает `STATUS: OK`.
