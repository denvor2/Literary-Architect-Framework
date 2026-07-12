id: Sprint-30-Step-04
name: "API endpoints: аутентификация и защита по ролям"
type: implementation

## Контекст

Step-03 завершил repository-слой. Теперь нужно создать HTTP endpoints для:
- POST /api/auth/register (регистрация)
- POST /api/auth/login (вход)
- GET /api/auth/me (текущий пользователь)
- POST /api/auth/logout (выход)
- Middleware для защиты других endpoints по role

Все существующие endpoints (workspace, series, expert routes) должны проверять role 
текущего пользователя и отказывать доступ, если пользователь не авторизован.

## Scope

Allowed paths:
- apps/studio/src/app/api/auth/ (новая папка с route.ts для register, login, me, logout)
- apps/studio/src/middleware.ts (NEW, middleware для защиты endpoints)
- apps/studio/src/lib/auth.ts (NEW, вспомогательные функции для JWT, если используется cookie)
- Обновление существующих endpoints (/workspace, /series, /expert routes) для проверки auth

Forbidden paths (НИКОГДА не трогать):
- Любые .env файлы (они не коммитятся)
- Domain model или repository-слой (только read)

## Rules

1. **POST /api/auth/register** (apps/studio/src/app/api/auth/register/route.ts):
   ```
   Request: { email: string, password: string, captchaToken: string }
   Response: { ok: true, userId: string, role: string } | { ok: false, error: string }
   
   - Валидировать email уникален (через repository)
   - Валидировать пароль >= 8 символов, содержит букву и цифру
   - Валидировать CAPTCHA token (решить: которые против какого провайдера проверять; для phase 1 можно placeholder)
   - Создать пользователя (repository.createUser) с role='user'
   - Вернуть 201 Created, userId и role в body
   - На ошибку: 400/409 с описанием
   ```

2. **POST /api/auth/login** (apps/studio/src/app/api/auth/login/route.ts):
   ```
   Request: { email: string, password: string }
   Response: { ok: true, userId: string, role: string } | { ok: false, error: string }
   
   - Найти пользователя по email (repository.findUserByEmail)
   - Проверить пароль (repository.checkPassword)
   - Проверить, что пользователь не заблокирован (user.isBlocked === false)
   - Создать JWT token (см. ниже про JWT)
   - Установить token в httpOnly cookie ИЛИ вернуть в body (по решению PO из ADR-0015)
   - Вернуть 200 OK, userId и role в body
   - На ошибку: 401 Unauthorized
   ```

3. **GET /api/auth/me** (apps/studio/src/app/api/auth/me/route.ts):
   ```
   Требует: валидный JWT в cookie или header Authorization: Bearer <token>
   Response: { ok: true, id: string, email: string, role: string, isBlocked: boolean } | { ok: false, error: string }
   
   - Извлечь token из cookie ИЛИ header (по решению PO)
   - Валидировать token (проверить подпись, срок действия)
   - Если invalid: 401 Unauthorized
   - Получить пользователя по ID из token (repository.getUserById)
   - Вернуть полные данные пользователя
   ```

4. **POST /api/auth/logout** (apps/studio/src/app/api/auth/logout/route.ts):
   ```
   Response: { ok: true } | { ok: false, error: string }
   
   - Если используются cookies: очистить httpOnly cookie
   - Если используется localStorage: просто return 200 (фронт очистит сам)
   - Всегда return 200 OK с { ok: true }
   ```

5. **Middleware (apps/studio/src/middleware.ts):**
   ```
   Проверять ВСЕ защищённые routes:
   - /api/workspace
   - /api/series
   - /api/critic, /api/reader, /api/coauthor, /api/line-editor
   - /api/book-field
   - /api/assistant-settings
   
   Логика:
   - Извлечь token из cookie ИЛИ header
   - Валидировать token
   - Если invalid: 401 Unauthorized с { ok: false, error: "Unauthorized" }
   - Если valid: продолжить (next())
   - Пропустить public routes: /api/auth/*, /api/health, /api/genres
   ```

6. **JWT (если используется):**
   - import jwt from 'jsonwebtoken'
   - SECRET_KEY в .env.local (NOT в коде, NOT в git)
   - Payload: { userId: string, role: string, email: string }
   - Срок действия: 7 дней (или по решению PO)
   - Алгоритм: HS256 (стандартный)

7. **Обработка ошибок:**
   - Если CAPTCHA провайдер недоступен: вернуть 503 Service Unavailable (рекомендация)
   - Если email уже существует: 409 Conflict
   - Если пароль не соответствует требованиям: 400 Bad Request с описанием требований
   - Если пользователь заблокирован: 403 Forbidden
   - Если database unavailable: 500 Internal Server Error

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - Никаких ошибок в новых auth route-файлах
   - JWT типы правильно импортированы

2. **Проверка структуры папок:**
   - apps/studio/src/app/api/auth/ содержит: register/route.ts, login/route.ts, me/route.ts, logout/route.ts
   - apps/studio/src/middleware.ts существует

3. **Базовая функциональная проверка (вручную, с curl или Postman):**
   - POST http://localhost:3000/api/auth/register { "email": "test@example.com", "password": "TestPass123", "captchaToken": "test" }
     => 201 Created, userId и role в body
   - POST http://localhost:3000/api/auth/login { "email": "test@example.com", "password": "TestPass123" }
     => 200 OK, userId и role в body, cookie установлен (если используется)
   - GET http://localhost:3000/api/auth/me
     => 200 OK, { id, email, role, isBlocked }
   - POST http://localhost:3000/api/workspace (без auth)
     => 401 Unauthorized (middleware перехватил)
   - POST http://localhost:3000/api/workspace (с валидным JWT)
     => 200/500 (зависит от логики, но auth пройдёт)

4. **`git status --short`** после завершения:
   ```
   A  apps/studio/src/app/api/auth/register/route.ts
   A  apps/studio/src/app/api/auth/login/route.ts
   A  apps/studio/src/app/api/auth/me/route.ts
   A  apps/studio/src/app/api/auth/logout/route.ts
   A  apps/studio/src/middleware.ts
   M  apps/studio/src/app/api/workspace/route.ts (добавлена проверка auth)
   M  apps/studio/src/app/api/series/route.ts (добавлена проверка auth)
   ... (и т.д. для остальных protected endpoints)
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст всех четырёх новых auth route-файлов
2. Полный текст middleware.ts
3. Изменения к существующим protected endpoints (сгруппированные по файлам)
4. Результат `npx tsc --noEmit`
5. Результаты curl/Postman проверок (json от каждого endpoint-а)
6. Результат `git status --short`

## Stop Condition

Не коммитить без подтверждения Product Owner.
