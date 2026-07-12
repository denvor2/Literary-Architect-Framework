id: Sprint-31-Step-07
name: "Автоматический откат на Free тариф и логирование событий подписки"
type: implementation

## Контекст

Steps 02-06 завершили основную функциональность тарифов и оплаты. Теперь нужно:
- Регулярно проверять expiration подписок и откатывать на Free
- Логировать все события подписки (subscribe, upgrade, downgrade, expire, failed payment)
- Обеспечить механизм проверки при login (lazy check на expiration)

Логирование будет использовано в Sprint 32 для аудита.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/billing/autoDowngrade.ts (новый файл, utility для откатного)
- apps/studio/src/app/api/cron/downgrade.ts (NEW — endpoint для scheduler/cron job)
- apps/studio/src/app/api/auth/login/route.ts (обновить для lazy check expiration при login)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (не трогать за исключением billingRepository)
- apps/studio/src/components/** (не трогать)

## Rules

1. **autoDowngrade.ts utility**

```typescript
// Проверить и откатить на Free план если истёк
export async function checkAndDowngradeExpiredSubscriptions(): Promise<{
  processedCount: number;
  downgradedCount: number;
}> {
  // Найти все подписки с status='active' и endDate <= now()
  // Для каждой:
  //   - Смените статус на 'expired'
  //   - Создайте новую подписку на Free план
  //   - Логируйте событие 'subscription_expired'
  // Вернуть кол-во обработанных и откатанных
}

// Логировать событие подписки (для Sprint 32 аудита)
export async function logBillingEvent(
  userId: string,
  eventType: 'subscription_created' | 'subscription_upgraded' | 
              'subscription_downgraded' | 'subscription_expired' | 
              'subscription_canceled' | 'payment_succeeded' | 
              'payment_failed' | 'payment_refunded',
  details: Record<string, unknown>
): Promise<void> {
  // Вставить запись в таблицу логов (TBD: может быть отдельная таблица или JSON)
  // details должны содержать: planId (старый/новый), subscriptionId, amount, reason и т.д.
}
```

2. **Endpoint: POST /api/cron/downgrade**

Простой endpoint для запуска checker из scheduler (Vercel Cron, external cron job, или ручной).

```typescript
// Request (может быть с X-Cron-Secret header для валидации):
// Response (200):
{
  ok: true,
  processedCount: 5,
  downgradedCount: 3
}
```

Обработка:
- Проверить что это действительно cron job (опциональная header валидация на Phase 1)
- Вызвать checkAndDowngradeExpiredSubscriptions()
- Вернуть результат
- На ошибку — return 500

3. **Login endpoint обновление (lazy check)**

В POST /api/auth/login (после успешной аутентификации, перед возвратом JWT):

```typescript
// После проверки пароля и role, но перед return:
await downgradeToFreeIfExpired(user.id);
```

Это обеспечит "lazy" проверку expiration при каждом login.

4. **Логирование событий подписки**

Все операции с подписками должны логироваться:

- POST /api/billing/subscribe (после успеха):
  ```typescript
  await logBillingEvent(userId, 'subscription_created', {
    planId,
    subscriptionId,
    startDate,
    endDate,
    amount: plan.price,
  });
  ```

- PUT /api/billing/payment/[id] (при succeeded):
  ```typescript
  await logBillingEvent(userId, 'payment_succeeded', {
    paymentId,
    amount,
    subscriptionId,
    planId,
  });
  ```

- При failed payment:
  ```typescript
  await logBillingEvent(userId, 'payment_failed', {
    paymentId,
    amount,
    failureReason,
  });
  ```

- В checkAndDowngradeExpiredSubscriptions():
  ```typescript
  await logBillingEvent(userId, 'subscription_expired', {
    subscriptionId,
    planId: 'plan_free',
    reason: 'automatic_downgrade_on_expiration',
  });
  ```

5. **Scheduler options (Phase 1 — любой из этих)**

**Option A: Vercel Cron (if running on Vercel)**
- Доступно в `vercel.json` или через Next.js Routes
- Запускает endpoint регулярно (e.g., раз в день)

**Option B: External cron service (e.g., cron-job.org)**
- Запускает HTTP GET/POST на наш endpoint с интервалом
- Требует внешний сервис, но не привязан к платформе хостинга

**Option C: Lazy check только (no explicit scheduler)**
- checkAndDowngradeExpiredSubscriptions() вызывается только при login
- Не гарантирует проверку если пользователь долго не логинился
- Допустимо для Phase 1, но лучше иметь explicit scheduler

**Рекомендация:** Option A (Vercel Cron) если на Vercel, иначе Option B.

Пока Phase 1: просто создать endpoint /api/cron/downgrade и документировать, 
что его нужно вызывать регулярно из внешнего scheduler'а.

6. **Обработка ошибок**

- Если checkAndDowngradeExpiredSubscriptions() выброс ошибку:
  - Логировать её (console.error)
  - Вернуть 500 с описанием
  - НЕ молча падать

- Если logBillingEvent() выброс ошибку:
  - Логировать её
  - НЕ блокировать основную операцию (billing event не должен сломать платёж)

## Validation

Все команды из apps/studio/:

1. `npx tsc --noEmit` — никаких ошибок

2. `npx eslint src/billing/autoDowngrade.ts` и `src/app/api/cron/downgrade.ts`

3. `npm run build` — собирается без ошибок

4. Ручное тестирование (если есть Postgres):

```bash
# Создать тестовую expired подписку
psql literary_studio << SQL
  INSERT INTO user_subscription (id, "userId", "planId", status, "startDate", "endDate")
  VALUES ('sub_test', 'user_id', 'plan_pro', 'active', now() - interval '1 day', now() - interval '1 second');
SQL

# Вызвать cron endpoint
curl http://localhost:3000/api/cron/downgrade

# Проверить результаты
psql literary_studio -c "SELECT * FROM user_subscription WHERE id = 'sub_test';"
# status должно быть 'expired'

psql literary_studio -c "SELECT * FROM user_subscription WHERE \"userId\" = 'user_id' AND status = 'active';"
# должна быть новая подписка на Free план
```

5. Проверка логирования:

```bash
# Если логи пишутся в отдельную таблицу:
psql literary_studio -c "SELECT * FROM billing_events LIMIT 10;"
```

## Stop Condition

Не коммитить без подтверждения Product Owner на выбор scheduler механизма (Vercel Cron, external, или только lazy check).
