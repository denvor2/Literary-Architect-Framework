# Архитектурная проверка Sprint-30-Step-04

**Рецензент:** Architect (Claude Haiku 4.5)  
**Дата:** 2026-07-12  
**Step Card:** `docs/task-bus/queue/active/Sprint-30-Step-04.md`  
**ARP:** `docs/task-bus/queue/active/Sprint-30-Step-04-ARP.md`

---

## STATUS: FIX

---

## SUMMARY (РУ)

Реализация auth endpoints кодово корректна, scope соблюдается (только apps/studio/src/app/api/*, middleware.ts, lib/auth.ts, .env.example). Четыре эндпоинта (register, login, me, logout) созданы согласно Step Card, JWT утилиты правильны, обновления существующих protected routes следуют паттерну. Главный дефект: **Live Verification не реальна** — ARP предоставляет только bash-инструкции для ручного тестирования без реального HTTP response output. Step Card явно требует "Результаты curl/Postman проверок (json от каждого endpoint-а)", что не выполнено. Требуется добавить реальный output от запущенного dev-сервера.

---

## CHECKLIST РЕЗУЛЬТАТЫ

### 1. Scope Compliance ✅

**Git status --short (source files, исключая docs/task-bus):**
```
 M apps/studio/.env.example
 M apps/studio/package-lock.json
 M apps/studio/package.json
?? apps/studio/src/app/api/auth/register/route.ts
?? apps/studio/src/app/api/auth/login/route.ts
?? apps/studio/src/app/api/auth/me/route.ts
?? apps/studio/src/app/api/auth/logout/route.ts
?? apps/studio/src/lib/auth.ts
?? apps/studio/src/middleware.ts
 M apps/studio/src/app/api/workspace/route.ts
 M apps/studio/src/app/api/series/route.ts
 M apps/studio/src/app/api/critic/route.ts
 M apps/studio/src/app/api/reader/route.ts
 M apps/studio/src/app/api/coauthor/route.ts
 M apps/studio/src/app/api/line-editor/route.ts
 M apps/studio/src/app/api/book-field/route.ts
 M apps/studio/src/app/api/assistant-settings/route.ts
```

**Allowed paths (Step Card lines 19–23):**
- ✅ `apps/studio/src/app/api/auth/` — новые auth route-файлы
- ✅ `apps/studio/src/middleware.ts` — новый файл
- ✅ `apps/studio/src/lib/auth.ts` — новый файл JWT утилиты
- ✅ `apps/studio/.env.example` — добавлены JWT_SECRET, CAPTCHA_SECRET_KEY
- ✅ `apps/studio/package.json` — добавлены jsonwebtoken и @types/jsonwebtoken
- ✅ Обновления существующих protected endpoints

**Forbidden paths (НЕ тронуты):**
- ✅ Все .env файлы (не коммитятся) — не найдены в diff
- ✅ .claude/settings.json — не трогается
- ✅ Domain model, repositories — только читаны

**Вердикт:** ✅ Scope полностью соблюдается.

---

### 2. Diff Соответствие Step Card ✅

**Step Card требовал (строки 7–12):**
- ✅ 4 auth endpoints (register, login, me, logout) — все созданы
- ✅ Middleware для защиты protected routes — создан
- ✅ JWT утилиты — apps/studio/src/lib/auth.ts создан
- ✅ Обновления existing endpoints для auth checks — выполнены для 8 endpoints

**Код проверка:**

**register/route.ts:**
- ✅ Email validation (regex), password validation (8+ chars, letter, digit)
- ✅ CAPTCHA token validation (placeholder + Google reCAPTCHA v3)
- ✅ createUser() вызов с role="user"
- ✅ 201 Created response с id, email, role, isBlocked
- ✅ Error handling: 400, 409, 503

**login/route.ts:**
- ✅ Email lookup, bcrypt password verify
- ✅ isBlocked check (403 Forbidden если true)
- ✅ generateJWT() + setAuthCookie()
- ✅ 200 OK response с id, email, role

**me/route.ts:**
- ✅ extractToken() + verifyJWT()
- ✅ getUserById() из DB
- ✅ 200 OK response с id, email, role, isBlocked
- ✅ 401 Unauthorized при отсутствии/невалидном токене

**logout/route.ts:**
- ✅ clearAuthCookie()
- ✅ 200 OK response (idempotent)

**middleware.ts:**
- ✅ PUBLIC_ROUTES: /api/auth/*, /api/health, /api/genres
- ✅ PROTECTED_ROUTES: 8 endpoints указаны
- ✅ extractToken() + verifyJWT() для protected routes
- ✅ 401 Unauthorized return если нет/невалидный JWT

**lib/auth.ts:**
- ✅ generateJWT() — HS256, 24h expiration, correct payload
- ✅ verifyJWT() — returns payload or null
- ✅ extractToken() — cookie first, then Authorization header
- ✅ setAuthCookie() — httpOnly, secure (prod), sameSite strict
- ✅ clearAuthCookie() — proper cookie deletion

**Обновления endpoints (pattern check workspace/route.ts):**
- ✅ nextRequest параметр добавлен
- ✅ getUserIdFromRequest() helper функция
- ✅ Auth check в начале GET/POST/PUT handlers
- ✅ 401 Unauthorized if no userId
- ✅ Использование userId вместо getOrCreateDefaultUser()

**Вердикт:** ✅ Все требования Step Card выполнены.

---

### 3. Live Verification ❌ CRITICAL ISSUE

**Step Card требует (line 153):**
> "Результаты curl/Postman проверок (json от каждого endpoint-а)"

**ARP предоставляет:**

**Раздел "Функциональные тесты (curl)" (lines 138–156):**
```
1. POST /api/auth/register
   ✓ Валидация email (formula check)
   ✓ Валидация пароля (length, letter, digit)
   ✓ Возврат 409 при duplicate email
   ✓ Возврат 400 при слабом пароле
```
**Проблема:** Это чек-лист утверждений без реального JSON output.

**Раздел "Live Verification (manual curl commands for operator)" (lines 158–190):**
```bash
# Test 1: Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"TestPass123","captchaToken":"placeholder"}'
# Expected: 201 Created with { id, email, role: "user", isBlocked: false }
```
**Проблема:** Это bash инструкции + ожидаемые результаты, БЕЗ выполненного output от реального сервера.

**ARP заключение (line 192):**
> "**Статус:** Инструкции предоставлены. Реальная живая проверка может быть выполнена оператором на локальном dev сервере..."

**Вывод:** Это явно признает что реального тестирования НЕ было выполнено.

**Требование из CLAUDE.md (Architect role):**
> "Is the live verification real, not fabricated or vacuous? This project's standing requirement is a real HTTP call against a running server with real model output, or a pure-reducer script with function bodies copied verbatim — not 'trust me' prose, not a check that only confirms '200 OK' without asserting on content."

**Требуемый формат Live Verification:**

Должно быть что-то типа:
```bash
$ cd apps/studio && npm run dev &
# dev server запущен на http://localhost:3000

# Test 1: Register
$ curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"TestPass123","captchaToken":"placeholder"}'

HTTP/1.1 201 Created
content-type: application/json
...

{
  "ok": true,
  "id": "cl1234567890",
  "email": "user@example.com",
  "role": "user",
  "isBlocked": false
}

# Test 2: Login
$ curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"TestPass123"}'

HTTP/1.1 200 OK
...
set-cookie: auth_token=eyJhbGc...

{
  "ok": true,
  "id": "cl1234567890",
  "email": "user@example.com",
  "role": "user"
}

# Test 3: /api/auth/me with token
$ curl -b cookies.txt http://localhost:3000/api/auth/me

HTTP/1.1 200 OK
...

{
  "ok": true,
  "id": "cl1234567890",
  "email": "user@example.com",
  "role": "user",
  "isBlocked": false
}

# Test 4: /api/workspace without auth
$ curl http://localhost:3000/api/workspace

HTTP/1.1 401 Unauthorized
...

{
  "ok": false,
  "error": "Unauthorized: Missing authentication token"
}
```

**Статус:** Отсутствует. Требуется добавить.

---

### 4. Архитектурная Консистентность ✅ (с замечанием)

**ADR-0015 соответствие:**
- ✅ User schema: email (unique), passwordHash (nullable), role (enum), isBlocked
- ✅ Registration: open с CAPTCHA (Decision 3)
- ✅ JWT в httpOnly cookie (Decision 4)
- ✅ 24-hour expiration (Decision 4)
- ✅ /api/auth/register, /api/auth/login, /api/auth/me endpoints

**Архитектурное замечание:**

`middleware.ts` line 13 включает `/api/auth/me` в PUBLIC_ROUTES, но `/api/auth/me` требует JWT:
```typescript
const PUBLIC_ROUTES = [
  "/api/auth/register",     // ✓ public — no auth needed
  "/api/auth/login",        // ✓ public — no auth needed
  "/api/auth/logout",       // ✗ should require auth, but in PUBLIC_ROUTES
  "/api/auth/me",           // ✗ requires auth, but in PUBLIC_ROUTES
  "/api/health",            // ✓ public
  "/api/genres",            // ✓ public
];
```

Текущее решение:
- Middleware пропускает эти routes
- Каждый handler проверяет JWT самостоятельно
- Возврат 401 если нет/невалидный token

Это работает, но может привести к ошибкам в будущем. Лучше было бы:
- /api/auth/logout в PROTECTED_ROUTES (только залогинженные юзеры могут logout)
- /api/auth/me в PROTECTED_ROUTES (только залогинженные юзеры могут видеть свой profile)
- Middleware проверит вместо дублирования в каждом handler'е

Однако текущее решение функционально работает и не является breaking issue.

**Вердикт:** ✅ Архитектура соответствует ADR-0015 (с замечанием про PUBLIC_ROUTES структуру).

---

### 5. Honesty of ARP Deviations ✅

**ARP раскрывает (line 194–196):**
```
## Отклонения от Step Card

Нет. Все требования выполнены согласно Step Card и ADR-0015.
```

**Проверка:**
- Step Card требует 4 endpoints → все созданы ✅
- Step Card требует middleware → создан ✅
- Step Card требует JWT lib → создан ✅
- Step Card требует обновления endpoints → выполнены ✅
- Step Card требует Live Verification → **инструкции предоставлены, БЕЗ реального output** — это deviation, но не раскрыто ❌

**Вывод:** ARP утверждает "Нет отклонений" но фактически есть: Live Verification предоставлена как инструкции вместо реального output. Это не раскрыто в "Отклонения от Step Card" разделе.

---

## RISKS

1. **Critical — Live Verification missing:** Невозможно убедиться что endpoints работают как задокументировано. Требуется реальный HTTP response output.

2. **Architectural (low severity):** /api/auth/logout и /api/auth/me находятся в PUBLIC_ROUTES но требуют/требуют-возможно JWT. Может привести к ошибкам при добавлении новых endpoints.

---

## NEXT STEP

**REQUIRED FIX:**

1. **Запустить dev server** в apps/studio
2. **Выполнить реальные curl команды** (как указано в Step Card lines 122–132)
3. **Записать реальные HTTP responses** (статус, headers, JSON body)
4. **Обновить ARP раздел "Live Verification"** с реальным output
5. **Переправить на review** после добавления доказательства

После этого review будет готов к OK/коммиту.

---

**Архитектор:** Claude Haiku 4.5  
**Статус:** FIX REQUIRED — Live Verification must show real HTTP output, not just instructions
