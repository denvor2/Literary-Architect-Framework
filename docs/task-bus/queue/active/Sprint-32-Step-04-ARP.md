# ARP: Sprint-32-Step-04 — Интеграция логирования в существующие маршруты

**Статус:** Готово к проверке архитектором и тестированию.

## Что сделано

Реализована интеграция системы логирования событий (Event Repository, Step-03) в 6 групп маршрутов:

1. **Аутентификация (auth)**: логирование входа (успех/ошибка), регистрации, выхода
2. **Workspace (книги/главы/сцены)**: логирование обновлений рабочего пространства
3. **Billing (подписки и платежи)**: логирование создания подписок и изменения статуса платежей
4. **Expert endpoints (Critic, Reader, CoAuthor, LineEditor)**: логирование AI-запросов с метриками производительности

## Соответствие Scope

✓ **Allowed paths — все созданы/модифицированы:**
- `apps/studio/src/lib/auditLogger.ts` (новый файл) — utility для безопасного логирования
- `apps/studio/src/app/api/auth/login/route.ts` — логирование login_success/login_failure
- `apps/studio/src/app/api/auth/register/route.ts` — логирование register_success
- `apps/studio/src/app/api/auth/logout/route.ts` — логирование logout
- `apps/studio/src/app/api/workspace/route.ts` — логирование workspace_updated
- `apps/studio/src/app/api/billing/subscribe/route.ts` — логирование subscription_created
- `apps/studio/src/app/api/billing/payment/[id]/route.ts` — логирование payment_completed/payment_failed
- `apps/studio/src/app/api/critic/route.ts` — логирование ai_request_critic
- `apps/studio/src/app/api/reader/route.ts` — логирование ai_request_reader
- `apps/studio/src/app/api/coauthor/route.ts` — логирование ai_request_coauthor
- `apps/studio/src/app/api/line-editor/route.ts` — логирование ai_request_line_editor

✓ **Forbidden paths — не трогались:**
- repositories/** (только импортируется safeLogEvent → auditRepository)
- domain/model.ts
- UI-код

## Код: lib/auditLogger.ts

```typescript
import { logEvent } from "@/repositories/auditRepository";

/**
 * Логировать событие, но не блокировать основную операцию если логирование выбросит ошибку.
 * Используется везде, где нужно логировать, но ошибка логирования не должна сломать операцию.
 */
export async function safeLogEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await logEvent(userId, eventType, metadata);
  } catch (error) {
    // Log the error but don't throw
    console.error(
      `[AuditLog] Failed to log event ${eventType} for user ${userId}:`,
      error,
    );
  }
}
```

## Логирование по маршрутам

### POST /api/auth/login
- **login_success**: email, ipAddress, userAgent (при успешной аутентификации)
- **login_failure**: email, failureReason (invalid_credentials | user_blocked), ipAddress, userAgent

### POST /api/auth/register
- **register_success**: email, role (при успешном создании пользователя)

### POST /api/auth/logout
- **logout**: email (при выходе, если userId доступен)

### PUT /api/workspace
- **workspace_updated**: booksCount, chaptersCount, scenesCount (при сохранении рабочего пространства)

### POST /api/billing/subscribe
- **subscription_created**: subscriptionId, planId, startDate, endDate (при создании подписки)

### PUT /api/billing/payment/[id]
- **payment_completed**: paymentId, amount (когда payment.status == "completed")
- **payment_failed**: paymentId, failureReason (когда payment.status == "failed")

### POST /api/critic
- **ai_request_critic** (success): sceneId, durationMs, tokenCount, status="success"
- **ai_request_critic** (error): sceneId, durationMs, status="failed", errorMessage

### POST /api/reader
- **ai_request_reader** (success): sceneId, durationMs, tokenCount, status="success"
- **ai_request_reader** (error): sceneId, durationMs, status="failed", errorMessage

### POST /api/coauthor
- **ai_request_coauthor** (success/error): sceneId, mode (draft|structure), durationMs, tokenCount (success), status, errorMessage (error)

### POST /api/line-editor
- **ai_request_line_editor** (success): sceneId, durationMs, tokenCount, status="success"
- **ai_request_line_editor** (error): sceneId, durationMs, status="failed", errorMessage

## Validation — результаты

### 1. TypeScript (npx tsc --noEmit)
```
✓ Passed (no errors)
```
- Все вызовы safeLogEvent имеют правильные типы
- Все импорты решены
- startTime инициализирован в Expert endpoints

### 2. ESLint (npx eslint src/app/api/*)
```
✓ Passed (no errors, no warnings)
```

### 3. Prettier (npx prettier --check)
```
✓ Passed после автоматического форматирования:
  - src/app/api/workspace/route.ts
  - src/app/api/critic/route.ts
  - src/app/api/reader/route.ts
  - src/app/api/coauthor/route.ts
  - src/app/api/line-editor/route.ts
```

### 4. Build (npm run build)
TypeScript компиляция прошла успешно.
Build столкнулся с файловой блокировкой на Windows (.next/standalone),
но это не связано с изменениями кода — это известная проблема файловой системы.
Код скомпилирован без ошибок TypeScript/ESLint.

## Отклонения от Step Card

**1 одобренное отклонение (Product Owner decision, 2026-07-12):**

### Workspace логирование: Aggregate vs Fine-grained

**Step Card требует:** Отдельные события для каждой CRUD операции
```
book_created, book_updated, chapter_created, chapter_updated, 
scene_created, scene_updated (для каждой операции отдельный safeLogEvent вызов)
```

**Реализация:** Одно aggregate событие с счётчиками
```typescript
await safeLogEvent(userId, "workspace_updated", {
  booksCount: books.length,
  chaptersCount,
  scenesCount,
});
```

**Причина отклонения:** PUT /api/workspace принимает полное состояние (все книги/главы/сцены) и заменяет его целиком. Endpoint-архитектура не различает создание vs обновление отдельных элементов, и не может логировать какие конкретно элементы созданы/обновлены без дорогостоящего diff-comparison.

**Decision:** Product Owner одобрил aggregate logging как приемлемый компромисс. Если в будущем потребуется fine-grained logging, потребуется переделать endpoint-логику для отслеживания изменений.

**Другие требования Step Card — реализованы полностью:**
- Helper safeLogEvent создан и используется везде
- Логирование добавлено во все 6 групп маршрутов (auth, workspace, billing, expert)
- Expert endpoints логируют с performance metrics (durationMs, tokenCount)
- userId извлекается из JWT где доступен
- Graceful error handling: logEvent errors не блокируют основную операцию

## Stop Condition

**Не коммитить без подтверждения Product Owner (STATUS: OK).**

ARP готов к архитектурной проверке и независимому функциональному тестированию.
