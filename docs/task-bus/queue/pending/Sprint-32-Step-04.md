id: Sprint-32-Step-04
name: "Интеграция логирования: auth, billing, книги, AI-запросы"
type: implementation

## Контекст

Steps 02-03 создали Event таблицу и repository. Теперь нужно добавить вызовы logEvent()
в существующие маршруты и функции:
- POST /api/auth/login (логировать успех и ошибку)
- POST /api/auth/register (логировать создание пользователя)
- POST /api/auth/logout (логировать выход)
- POST /api/workspace (логировать CRUD книг/глав/сцен)
- POST /api/billing/* (логировать события подписки и платежей) — требует Sprint-31
- Expert endpoints /api/critic, /api/reader, etc. (логировать запросы с временем выполнения)

Плюс добавить helper для логирования с обработкой ошибок (не блокировать основную операцию,
если логирование выбросит ошибку).

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/app/api/auth/login/route.ts (добавить вызовы logEvent)
- apps/studio/src/app/api/auth/register/route.ts (добавить вызовы logEvent)
- apps/studio/src/app/api/auth/logout/route.ts (добавить вызовы logEvent)
- apps/studio/src/app/api/workspace/route.ts (добавить вызовы logEvent для книг/глав/сцен)
- apps/studio/src/app/api/billing/* (добавить вызовы logEvent для подписок и платежей)
- apps/studio/src/app/api/critic/route.ts, /reader/, /coauthor/, /line-editor/ (добавить logEvent)
- apps/studio/src/lib/auditLogger.ts (новый файл — utility для безопасного логирования)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (только читать из auditRepository)
- apps/studio/src/domain/model.ts (не тогать)
- Любой UI-код (это Step-05)

## Rules

1. **Новый файл lib/auditLogger.ts (safety wrapper):**

```typescript
import { logEvent } from "@/repositories/auditRepository";

/**
 * Логировать событие, но не блокировать основную операцию если логирование выбросит ошибку.
 * Используется везде, где нужно логировать, но ошибка логирования не должна сломать операцию.
 */
export async function safeLogEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await logEvent(userId, eventType, metadata);
  } catch (error) {
    // Log the error but don't throw
    console.error(
      `[AuditLog] Failed to log event ${eventType} for user ${userId}:`,
      error
    );
  }
}
```

2. **POST /api/auth/login/route.ts:**

После успешной аутентификации (перед возвратом JWT):
```typescript
import { safeLogEvent } from "@/lib/auditLogger";

// При успехе:
await safeLogEvent(user.id, "login_success", {
  email: user.email,
  ipAddress: req.headers.get("x-forwarded-for") || "unknown",
  userAgent: req.headers.get("user-agent"),
});

// При ошибке:
await safeLogEvent(email, "login_failure", {
  email,
  failureReason: "invalid_credentials" | "user_blocked",
  ipAddress: req.headers.get("x-forwarded-for") || "unknown",
  userAgent: req.headers.get("user-agent"),
});
```

3. **POST /api/auth/register/route.ts:**

После успешного создания пользователя:
```typescript
await safeLogEvent(newUser.id, "register_success", {
  email: newUser.email,
  role: newUser.role,
});
```

4. **POST /api/auth/logout/route.ts:**

```typescript
await safeLogEvent(user.id, "logout", { email: user.email });
```

5. **POST /api/workspace/route.ts (книги/главы/сцены):**

Для каждой операции CRUD:
```typescript
// При создании книги:
await safeLogEvent(userId, "book_created", {
  bookId: newBook.id,
  title: newBook.title,
  genre: newBook.genre,
});

// При обновлении книги:
const fieldsChanged = [];
if (updates.title !== undefined) fieldsChanged.push("title");
if (updates.genre !== undefined) fieldsChanged.push("genre");
if (fieldsChanged.length > 0) {
  await safeLogEvent(userId, "book_updated", {
    bookId: book.id,
    fields_changed: fieldsChanged,
  });
}

// Аналогично для chapter_created, chapter_updated, scene_created, scene_updated, etc.
```

6. **POST /api/billing/subscribe/route.ts (Sprint 31 интеграция):**

После создания подписки:
```typescript
await safeLogEvent(userId, "subscription_created", {
  subscriptionId: subscription.id,
  planId: subscription.planId,
  startDate: subscription.startDate.toISOString(),
  endDate: subscription.endDate?.toISOString() || null,
});
```

7. **POST /api/billing/payment/[id]/route.ts (Sprint 31):**

После обновления статуса платежа:
```typescript
if (payment.status === "completed") {
  await safeLogEvent(payment.userId, "payment_completed", {
    paymentId: payment.id,
    amount: payment.amount,
  });
} else if (payment.status === "failed") {
  await safeLogEvent(payment.userId, "payment_failed", {
    paymentId: payment.id,
    failureReason: payment.failureReason,
  });
}
```

8. **Expert endpoints (critic, reader, coauthor, line-editor):**

Обёрнуть вызов к Claude API в измеритель времени и логировать:
```typescript
import { performance } from "perf_hooks";

const startTime = performance.now();
const response = await anthropic.messages.create({...});
const durationMs = Math.round(performance.now() - startTime);

await safeLogEvent(userId, "ai_request_critic", {
  sceneId,
  durationMs,
  tokenCount: response.usage.output_tokens + response.usage.input_tokens,
  status: "success",
});
```

При ошибке:
```typescript
catch (error) {
  await safeLogEvent(userId, "ai_request_critic", {
    sceneId,
    durationMs: Math.round(performance.now() - startTime),
    status: "failed",
    errorMessage: error instanceof Error ? error.message : "unknown",
  });
  throw error;
}
```

## Validation

Все команды из apps/studio/:

1. **Типы:**
```bash
npx tsc --noEmit
```
- Никаких ошибок, все вызовы logEvent имеют правильные типы

2. **Linting:**
```bash
npx eslint src/app/api/auth/ src/app/api/workspace/ src/app/api/billing/ src/app/api/*/route.ts
```
- Никаких ошибок

3. **Build:**
```bash
npm run build
```
- Успешный билд без ошибок

4. **Ручное тестирование (если запущен dev сервер):**
```bash
# Попробовать логин
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Проверить логи в БД
psql literary_studio -c "SELECT eventType, COUNT(*) FROM \"Event\" GROUP BY eventType;"
```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Все изменённые файлы route.ts и их логирование вызовы (по одному на операцию)
2. Полный текст lib/auditLogger.ts
3. Результат `npx tsc --noEmit`
4. Результат `npm run build`
5. Если доступен тестовый сервер: результат проверки логов после операций

## Stop Condition

Не коммитить без подтверждения Product Owner.
