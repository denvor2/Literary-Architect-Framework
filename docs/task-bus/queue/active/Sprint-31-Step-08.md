id: Sprint-31-Step-08
name: "Billing Event Logging (foundation для Sprint-45)"
type: implementation

## Контекст

Sprint-31 завершила Prisma schema и Repository layer для биллинга. Billing функционал заморожен до Sprint-45, но нужно подготовить инфраструктуру логирования событий (используется в Sprint-32 для аудита).

## Scope

### Allowed paths (ТОЛЬКО):
- apps/studio/src/billing/billingLogger.ts (новый файл, функции логирования)
- apps/studio/src/repositories/billingRepository.ts (добавить вызовы logBillingEvent)

### Forbidden paths:
- Никаких cron endpoints
- Никаких auto-downgrade функций
- API endpoints не трогать

## Objective

Создать инфраструктуру для логирования billing событий. Функции будут вызываться из точек интеграции когда биллинг включат в Sprint-45.

### 1. billingLogger.ts (новый файл)

```typescript
export async function logBillingEvent(
  userId: string,
  eventType: 'subscription_created' | 'subscription_upgraded' | 
            'subscription_downgraded' | 'subscription_canceled' | 
            'payment_created' | 'payment_completed' | 'payment_failed',
  details: Record<string, unknown>
): Promise<void>
```

Логирует события в таблицу Event (существующая, используется для аудита).

**Поля события:**
- userId
- eventType (из enum EventType: subscription_*, payment_*)
- eventData (JSON с details: planId, subscriptionId, amount, reason, etc.)
- createdAt (автоматически)

**Обработка ошибок:**
- Если логирование падает, НЕ блокирует основную операцию
- Логирует ошибку в console.error
- Возвращает Promise (fire-and-forget)

### 2. Точки вызова (когда биллинг включат)

Функция будет вызваться из:

```typescript
// POST /api/billing/subscribe (в Step-04, когда включится)
await logBillingEvent(userId, 'subscription_created', {
  planId,
  subscriptionId,
  startDate,
  endDate,
  amount: plan.price,
});

// PUT /api/billing/payment/[id] (в Step-04, когда включится)
if (paymentStatus === 'completed') {
  await logBillingEvent(userId, 'payment_completed', {
    paymentId,
    amount,
    subscriptionId,
    planId,
  });
}
```

Но сами endpoints остаются DISABLED до Sprint-45.

## Rules

1. **logBillingEvent() должна быть:**
   - Async function
   - Non-blocking (fire-and-forget)
   - Готова к вызовам из Step-04 API (но те disabled до Sprint-45)

2. **EventType enum:**
   - Уже существует в Prisma schema
   - subscription_created, subscription_upgraded, subscription_downgraded, subscription_canceled
   - payment_created, payment_completed, payment_failed

3. **Обработка ошибок:**
   - Логируй ошибку, но не выбрасывай исключение
   - Billing операция должна пройти даже если логирование упало

## Validation

1. `npx tsc --noEmit` — TypeScript clean
2. `npm run build` — успешен
3. Функция экспортируется из billingRepository
4. Готова к вызовам (даже если endpoints disabled)

## Output

ARP файл в docs/task-bus/queue/active/:
1. Реализация logBillingEvent()
2. Типизация (EventType enum)
3. Обработка ошибок
4. Build статус
5. Готовность к Sprint-45 интеграции

## Stop Condition

Логирование готово к использованию. Endpoints по-прежнему DISABLED (Step-04 не реализована). Билинг замораживаем до Sprint-45.

## Notes

- **Sprint-31-Step-07**: FROZEN (auto-downgrade, cron) до Sprint-45
- **Sprint-31-Step-08**: Новый Step для логирования (foundation)
- **Sprint-45+**: Включить Step-07 когда биллинг возобновится
