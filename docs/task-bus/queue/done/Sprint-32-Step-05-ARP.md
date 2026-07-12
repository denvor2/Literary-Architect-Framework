id: Sprint-32-Step-05-ARP
date: 2026-07-12
status: ready-for-review

## Что сделано

Реализованы 3 API endpoint'а для просмотра логов аудита с поддержкой rate limiting:

1. **GET /api/audit/events/me** — просмотр собственных логов пользователя
   - Обязательно: startDate, endDate (ISO 8601)
   - Опционально: eventType (фильтр по типу события)
   - Rate limit: 30 запр/мин на пользователя
   - Возвращает: { success, data: Event[], totalCount }
   - Статусы: 200 OK, 400 (ошибка валидации), 401 (не авторизован), 500 (ошибка БД)

2. **GET /api/audit/events** (админ-только) — просмотр всех логов системы
   - Обязательно: startDate, endDate (ISO 8601)
   - Опционально: userId (фильтр), eventType (фильтр), limit (1-1000, дефолт 100), offset (дефолт 0)
   - Rate limit: 60 запр/мин для админов
   - Возвращает: { success, data: Event[], totalCount, limit, offset }
   - Статусы: 200 OK, 400, 401, 403 (не админ), 500

3. **GET /api/audit/events/stats** (админ-только) — статистика по типам событий
   - Обязательно: startDate, endDate (ISO 8601)
   - Опционально: userId (фильтр по пользователю)
   - Rate limit: 30 запр/мин для админов
   - Возвращает: { success, data: [{eventType, count}, ...], period: {startDate, endDate} }
   - Статусы: 200 OK, 400, 401, 403, 500

4. **lib/rateLimit.ts** — middleware для rate limiting
   - Функция `applyRateLimit(identifier, endpoint, customConfig?)` для аудит-endpoint'ов
   - Поддержка `RATE_LIMIT_DISABLED=true` env var для отключения при тестировании
   - Возвращаемые заголовки: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
   - Ответ 429 при превышении: { error, retryAfter }
   - Сохранена обратная совместимость: функции checkRateLimit и getClientIp для AI endpoint'ов

## Соответствие Scope

✅ **Allowed paths — все файлы созданы/модифицированы корректно:**
- `apps/studio/src/app/api/audit/` — создана папка со всеми endpoint'ами
- `apps/studio/src/app/api/audit/events/me/route.ts` — реализована полностью
- `apps/studio/src/app/api/audit/events/route.ts` — реализована с пагинацией
- `apps/studio/src/app/api/audit/events/stats/route.ts` — реализована с группировкой
- `apps/studio/src/lib/rateLimit.ts` — реализована с поддержкой env vars

✅ **Forbidden paths — не трогались:**
- `apps/studio/src/repositories/**` — только читали (использовали getUserEventLog, getEventStats)
- `apps/studio/src/middleware.ts` — не модифицировали
- UI код — не изменяли

## Validation

### 1. TypeScript (npx tsc --noEmit)
```
Статус: ✅ PASSED

Ошибки в audit endpoint'ах и rateLimit.ts: 0
Единственная ошибка в проекте (pre-existing):
  scripts/ensure-admin.ts(5,18): error TS2554
  (это не связано с Sprint-32-Step-05, существовала до моих изменений)
```

### 2. ESLint (npx eslint src/app/api/audit/)
```
Статус: ✅ PASSED

src/app/api/audit/events/me/route.ts: OK
src/app/api/audit/events/route.ts: OK
src/app/api/audit/events/stats/route.ts: OK
Ошибок: 0
```

### 3. Prettier (npx prettier --check)
```
Статус: ✅ PASSED (after formatting)

Применено форматирование ко всем файлам.
Повторная проверка: All matched files use Prettier code style!
```

### 4. Функциональность — проверка логики кода

**GET /api/audit/events/me:**
- ✅ Извлечение JWT токена из cookie или Authorization header
- ✅ Валидация JWT и получение userId из payload
- ✅ Rate limiting с проверкой на 30 запр/мин
- ✅ Обязательная валидация startDate и endDate (ISO 8601)
- ✅ Проверка startDate < endDate
- ✅ Опциональная фильтрация по eventType
- ✅ Использование getUserEventLog из auditRepository
- ✅ Добавление rate limit headers в ответ
- ✅ Обработка исключений (DB unavailable, ошибки парсинга)

**GET /api/audit/events:**
- ✅ Проверка JWT и payload
- ✅ Проверка role === "admin" (403 если не админ)
- ✅ Rate limiting 60 запр/мин
- ✅ Валидация всех параметров (startDate, endDate, limit, offset)
- ✅ Нормализация limit (1-1000, дефолт 100)
- ✅ Нормализация offset (>=0, дефолт 0)
- ✅ Построение фильтров (userId, eventType опционально)
- ✅ Использование prisma.event.findMany с пагинацией (take, skip)
- ✅ Параллельный запрос count для totalCount
- ✅ Сортировка по createdAt desc
- ✅ Полные rate limit headers

**GET /api/audit/events/stats:**
- ✅ Проверка JWT и role === "admin"
- ✅ Rate limiting 30 запр/мин
- ✅ Валидация startDate и endDate
- ✅ Использование getEventStats с опциональной фильтрацией userId
- ✅ Возврат периода в ISO 8601 format
- ✅ Корректные заголовки и обработка ошибок

**lib/rateLimit.ts:**
- ✅ Интерфейсы: RateLimitConfig, RateLimitResult
- ✅ Хранилище: Map<identifier, Map<endpoint, {count, resetTime}>>
- ✅ Логика: проверка окна, инкремент счетчика, возврат remaining
- ✅ Поддержка RATE_LIMIT_DISABLED=true
- ✅ Unix timestamp в секундах для resetTime
- ✅ Функции cleanup и resetRateLimit для тестирования
- ✅ Обратная совместимость: checkRateLimit и getClientIp сохранены

## Отклонения от Step Card

Нет. Все требования реализованы согласно Step Card:
- Все 3 endpoint'а имеют правильные статус-коды и заголовки
- Rate limiting работает правильно с env var
- Date validation выполняется корректно
- Admin-only endpoints проверяют role
- Pagination реализована с limit/offset
- Response format соответствует примерам в Step Card

## Stop Condition

✅ **Работа завершена. Ожидает подтверждения Product Owner (STATUS: OK) перед коммитом.**

Файлы готовы в `docs/task-bus/queue/active/`:
- Sprint-32-Step-05.md (Step Card)
- Sprint-32-Step-05-ARP.md (этот файл)

Код изменен только в allowed paths согласно Step Card. Git status показывает только ожидаемые файлы.
