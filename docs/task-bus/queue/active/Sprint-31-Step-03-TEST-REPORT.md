id: Sprint-31-Step-03-TEST-REPORT
date: 2026-07-15
status: FAIL

## Переверификация

Проведена независимая переверификация Sprint-31-Step-03 (Repository layer). Все статические проверки пройдены, но обнаружено серьезное логическое несоответствие в реализации.

## Статические проверки (PASS)

### TypeScript компиляция
```
npx tsc --noEmit
✓ Никаких ошибок типизации
```

### ESLint проверка
```
npx eslint src/repositories/billingRepository.ts
✓ Нет ошибок и предупреждений
```

### Prettier форматирование
```
npx prettier --check src/repositories/billingRepository.ts
Checking formatting...
All matched files use Prettier code style!
```

### Production build
```
npm run build
✓ Compiled successfully in 2.9s
✓ All 29 routes compiled
✓ TypeScript finalized without errors
```

## Проверка реализации (PASS — функции есть и типизированы)

### Все 14 функций реализованы:
- ✓ loadActivePlans() — Promise<Plan[]>
- ✓ loadPlan(planId) — Promise<Plan | null>
- ✓ getFreePlan() — Promise<Plan>
- ✓ loadActiveSubscription(userId) — Promise<ActiveSubscription | null>
- ✓ createSubscription(userId, planId, externalSubscriptionId?) — Promise<UserSubscription>
- ✓ updateSubscription(subscriptionId, planId, endDate?) — Promise<UserSubscription>
- ✓ cancelSubscription(subscriptionId) — Promise<UserSubscription>
- ✓ downgradeToFreeIfExpired(userId) — Promise<boolean>
- ✓ hasFeatureAccess(userId, feature) — Promise<boolean>
- ✓ canMakeAssistantRequest(userId) — Promise<boolean>
- ✓ getUserPlanInfo(userId) — Promise<{...}>
- ✓ createPayment(userId, subscriptionId, amount, externalPaymentId?) — Promise<Payment>
- ✓ updatePaymentStatus(paymentId, status, failureReason?) — Promise<Payment>
- ✓ loadPaymentHistory(userId) — Promise<Payment[]>

### Все 14 функций + тип ActiveSubscription экспортированы из index.ts:
```typescript
export {
  loadActivePlans,
  loadPlan,
  getFreePlan,
  loadActiveSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  downgradeToFreeIfExpired,
  hasFeatureAccess,
  canMakeAssistantRequest,
  getUserPlanInfo,
  createPayment,
  updatePaymentStatus,
  loadPaymentHistory,
} from "./billingRepository";
export type { ActiveSubscription } from "./billingRepository";
```

### Обработка ошибок (PASS):
- ✓ 18 throw statements для выброса 4 типов ошибок:
  - "Database connection unavailable" (13 функций)
  - "Free plan not found (data inconsistency)" (getFreePlan)
  - "Plan not found" (createSubscription, updateSubscription)
  - "Subscription not found" (createPayment)

### Scope compliance (PASS):
- ✓ Только разрешённые файлы изменены:
  - apps/studio/src/repositories/billingRepository.ts (создан)
  - apps/studio/src/repositories/index.ts (обновлён)
- ✓ Forbidden paths не трогались:
  - apps/studio/src/repositories/userRepository.ts
  - apps/studio/src/app/api/** (это Step-04, не трогалось)
  - Никакой UI-код не трогался

## ПРОБЛЕМА: Логическое несоответствие при подсчете запросов (FAIL)

### Обнаруженная проблема:

Две функции, которые считают "запросы пользователя за текущий месяц", используют РАЗНЫЕ логики фильтрации платежей:

#### canMakeAssistantRequest() — считает ВСЕ платежи:
```typescript
const requestCount = await prisma.payment.count({
  where: {
    userId,
    createdAt: { gte: monthStart },
    // NO status filter — считаются ALL платежи (pending, completed, failed)
  },
});
```

#### getUserPlanInfo() — считает ТОЛЬКО completed платежи:
```typescript
const requestsThisMonth = await prisma.payment.count({
  where: {
    userId,
    createdAt: { gte: monthStart },
    status: "completed",  // EXPLICIT status filter
  },
});
```

### Почему это проблема:

1. **Инконсистентность в бизнес-логике:** Две функции, которые считают один и тот же показатель ("запросы за месяц"), должны использовать одну и ту же логику подсчета.

2. **Несоответствие UI и проверки лимитов:**
   - Пользователь видит в UI (getUserPlanInfo): "Вы сделали 5 запросов"
   - Система проверяет лимит (canMakeAssistantRequest): считает 8 (5 completed + 3 pending)
   - Результат: пользователь видит противоречивую информацию

3. **Потенциальное нарушение лимитов:** Если canMakeAssistantRequest() считает pending платежи, то система может быть более консервативна, чем пользователь ожидает. Если Step Card требует, чтобы обе функции считали одно и тоже, то это является ошибкой.

### Step Card не уточняет:

Step Card требует:
- "Для canMakeAssistantRequest: считать запросы за текущий месяц (createdAt >= start of month)"
- "Для getUserPlanInfo: вернуть полное информационное объект для UI"

Но Step Card НЕ уточняет, какой статус платежей считать для canMakeAssistantRequest(). Однако, семантика "запросов за месяц" предполагает, что это должны быть ЗАВЕРШЁННЫЕ запросы (completed), а не попытки (pending/failed).

### Ожидаемое поведение:

Обе функции должны считать ТОЛЬКО платежи со статусом "completed", потому что:
- pending платежи — это попытки, которые могут быть отклонены webhook'ом от payment processor
- failed платежи — это неудачные попытки
- Только completed платежи — это фактические, успешные запросы

### Наблюдаемое поведение:

- canMakeAssistantRequest() считает ВСЕ платежи (independent of status)
- getUserPlanInfo() считает ТОЛЬКО completed платежи
- Несоответствие!

## Заключение

### Статические проверки: ✓ PASS
- TypeScript компиляция: OK
- ESLint: OK
- Prettier: OK
- Production build: OK
- Все функции типизированы и экспортированы: OK
- Обработка ошибок: OK
- Scope compliance: OK

### Логическая проверка: ✗ FAIL
- Обнаружено серьезное несоответствие в логике подсчета платежей
- canMakeAssistantRequest() и getUserPlanInfo() считают платежи по-разному
- Это может привести к проблемам с проверкой лимитов и отображением информации в UI

## Рекомендация

Нужно выровнять логику обеих функций. Вариант A: обе функции считают ТОЛЬКО completed платежи. Вариант B: обе функции считают ВСЕ платежи. Выбор должен быть основан на бизнес-требованиях.

**STATUS: FAIL**

Проблема должна быть исправлена до того, как Step-03 будет закоммичен.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
