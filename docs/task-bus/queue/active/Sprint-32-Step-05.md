id: Sprint-32-Step-05
name: "API endpoints: просмотр логов (для админов и пользователей)"
type: implementation

## Контекст

Steps 02-04 создали Event таблицу, repository, и интегрировали логирование.
Теперь нужны API endpoints для просмотра логов:
- Пользователи видят свои логи (последние 30 дней)
- Админы видят все логи системы
- Админы видят статистику

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/app/api/audit/ (новая папка)
- apps/studio/src/app/api/audit/events/me/route.ts (логи текущего пользователя)
- apps/studio/src/app/api/audit/events/route.ts (все логи, админ-только)
- apps/studio/src/app/api/audit/events/stats/route.ts (статистика, админ-только)

Allowed paths (дополнительно):
- apps/studio/src/lib/rateLimit.ts (новый файл — rate limiting middleware)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (только читать)
- apps/studio/src/middleware.ts (не добавлять auth тут)
- Любой UI-код (это Step-07 UI)

## Rules

### Rate Limiting (all endpoints)

Создать файл `lib/rateLimit.ts` с middleware:

```typescript
// Rate limiting config (can be overridden by env vars)
const RATE_LIMITS = {
  'GET /api/audit/events/me': { requests: 30, windowMs: 60000 }, // 30 req/min per user
  'GET /api/audit/events': { requests: 60, windowMs: 60000 }, // 60 req/min for admins
  'GET /api/audit/events/stats': { requests: 30, windowMs: 60000 }, // 30 req/min for admins
};

export async function applyRateLimit(
  identifier: string, // userId or IP
  endpoint: string,
  options?: { disabled?: boolean } // temp disable flag
): Promise<{ allowed: boolean; remaining: number }> {
  if (options?.disabled || process.env.RATE_LIMIT_DISABLED === 'true') {
    return { allowed: true, remaining: -1 };
  }
  
  // Implement in-memory or Redis rate limiting
  // Return { allowed: boolean, remaining: count }
}
```

**Configuration options:**
- `RATE_LIMIT_DISABLED=true` — временно отключить rate limiting (для тестирования)
- Environment variables для каждого endpoint (e.g., `AUDIT_EVENTS_ME_LIMIT=30`)

**Response headers:**
- `X-RateLimit-Limit: 30`
- `X-RateLimit-Remaining: 15`
- `X-RateLimit-Reset: 1234567890` (Unix timestamp)

**Response 429 (Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

---

### Endpoints

1. **GET /api/audit/events/me**

Auth required (текущий пользователь видит свои логи).

Query parameters:
- startDate: ISO 8601 string (обязательно)
- endDate: ISO 8601 string (обязательно)
- eventType: string (опционально, фильтр: login_success, book_created, ...)

Response 200:
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_xxx",
      "userId": "user_123",
      "eventType": "login_success",
      "metadata": { "email": "user@example.com", "ipAddress": "192.168.1.1" },
      "createdAt": "2026-07-12T10:30:00Z",
      "updatedAt": "2026-07-12T10:30:00Z"
    }
  ],
  "totalCount": 42
}
```

Response 401: Unauthorized (no auth token)

2. **GET /api/audit/events (ADMIN ONLY)**

Auth required + role='admin'.

Query parameters:
- startDate: ISO 8601 string (обязательно)
- endDate: ISO 8601 string (обязательно)
- userId: string (опционально, фильтр по пользователю)
- eventType: string (опционально, фильтр по типу события)
- limit: number (опционально, default 100, max 1000)
- offset: number (опционально, default 0)

Response 200:
```json
{
  "success": true,
  "data": [ ...Event[] ],
  "totalCount": 1234,
  "limit": 100,
  "offset": 0
}
```

Response 401: Unauthorized
Response 403: Forbidden (not admin)

3. **GET /api/audit/events/stats (ADMIN ONLY)**

Auth required + role='admin'.

Query parameters:
- startDate: ISO 8601 string (обязательно)
- endDate: ISO 8601 string (обязательно)
- userId: string (опционально, фильтр по пользователю)

Response 200:
```json
{
  "success": true,
  "data": [
    { "eventType": "login_success", "count": 450 },
    { "eventType": "ai_request_critic", "count": 280 },
    { "eventType": "book_updated", "count": 95 },
    ...
  ],
  "period": { "startDate": "2026-07-01T00:00:00Z", "endDate": "2026-07-12T23:59:59Z" }
}
```

Response 401: Unauthorized
Response 403: Forbidden (not admin)

4. **Обработка ошибок:**

- Missing or invalid query params: 400 Bad Request
```json
{ "success": false, "error": "startDate must be a valid ISO 8601 date" }
```

- Database unavailable: 500 Internal Server Error
```json
{ "success": false, "error": "Database connection unavailable" }
```

- Any other error: 500
```json
{ "success": false, "error": "Internal server error" }
```

5. **Validation в каждом endpoint:**

```typescript
// Проверить даты
const startDate = new Date(query.startDate || "");
const endDate = new Date(query.endDate || "");
if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
  return NextResponse.json(
    { success: false, error: "Invalid date format" },
    { status: 400 }
  );
}
if (startDate >= endDate) {
  return NextResponse.json(
    { success: false, error: "startDate must be before endDate" },
    { status: 400 }
  );
}
```

6. **Middleware проверка auth и role:**

В каждом endpoint:
```typescript
const user = await getCurrentUser(); // из middleware
if (!user) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}

// Для админских endpoints:
if (user.role !== "admin") {
  return NextResponse.json(
    { success: false, error: "Forbidden" },
    { status: 403 }
  );
}
```

## Validation

Все команды из apps/studio/:

1. **Типы:**
```bash
npx tsc --noEmit
```
- Никаких ошибок

2. **Linting:**
```bash
npx eslint src/app/api/audit/
```
- Никаких ошибок

3. **Build:**
```bash
npm run build
```
- Успешный билд

4. **Ручное тестирование (если запущен dev сервер):**

```bash
# Без auth — должен вернуть 401
curl http://localhost:3000/api/audit/events/me?startDate=2026-07-01&endDate=2026-07-12

# С auth cookie (после логина)
curl -b "auth_token=..." \
  "http://localhost:3000/api/audit/events/me?startDate=2026-07-01&endDate=2026-07-12"
# Должен вернуть Events[] текущего пользователя

# Админский endpoint (если админ залогинен)
curl -b "auth_token=..." \
  "http://localhost:3000/api/audit/events?startDate=2026-07-01&endDate=2026-07-12&limit=50"
# Должен вернуть все события системы (если админ)

# Статистика
curl -b "auth_token=..." \
  "http://localhost:3000/api/audit/events/stats?startDate=2026-07-01&endDate=2026-07-12"
# Должен вернуть подсчёт по eventType
```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст всех трёх route.ts файлов (/me, основной, /stats)
2. Результат `npx tsc --noEmit`
3. Результат `npm run build`
4. Результат `npx eslint src/app/api/audit/`
5. Если доступен тестовый сервер: результат curl запросов (успех и ошибки)

## Stop Condition

Не коммитить без подтверждения Product Owner.
