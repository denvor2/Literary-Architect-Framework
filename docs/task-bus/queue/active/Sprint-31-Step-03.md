id: Sprint-31-Step-03
name: "Repository слой: функции для работы с тарифами и подписками"
type: implementation

## Контекст

Step-02 завершил Prisma schema. Теперь repository-слой должен предоставить функции для:
- Загрузки доступных тарифных планов
- Загрузки активной подписки пользователя
- Создания/обновления подписки
- Проверки прав доступа пользователя (feature gating)
- Загрузки/сохранения информации о платежах
- Автоматического откатного на Free тариф

Эти функции будут использованы в Step-04 (API endpoints), Step-05 (контроллер), 
и в expert routes для request limiting.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/repositories/billingRepository.ts (новый файл)
- apps/studio/src/repositories/index.ts (экспортировать новые функции)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/userRepository.ts (не трогать)
- apps/studio/src/app/api/** (это Step-04)
- Любой UI-код (это Step-06)

## Rules

1. **Новые типы (в начале billingRepository.ts):**
   
   ```typescript
   import type { Plan, UserSubscription, Payment } from "@/generated/prisma/client";
   import { PlanTier, SubscriptionStatus, PaymentStatus } from "@/generated/prisma/client";
   
   type ActiveSubscription = {
     subscription: UserSubscription;
     plan: Plan;
   };
   ```

2. **Функции для работы с планами:**
   
   ```typescript
   // Загрузить все активные тарифные планы (для UI выбора)
   export async function loadActivePlans(): Promise<Plan[]>
   
   // Загрузить конкретный план по ID
   export async function loadPlan(planId: string): Promise<Plan | null>
   
   // Загрузить Free план (всегда должен существовать)
   export async function getFreePlan(): Promise<Plan>
   ```

3. **Функции для работы с подписками:**
   
   ```typescript
   // Загрузить активную подписку пользователя с плана
   export async function loadActiveSubscription(userId: string): Promise<ActiveSubscription | null>
   
   // Создать новую подписку (при покупке плана)
   export async function createSubscription(
     userId: string,
     planId: string,
     externalSubscriptionId?: string
   ): Promise<UserSubscription>
   
   // Обновить существующую подписку (при upgrade/downgrade)
   export async function updateSubscription(
     subscriptionId: string,
     planId: string,
     endDate?: Date
   ): Promise<UserSubscription>
   
   // Отменить подписку (пользователь отписывается)
   export async function cancelSubscription(subscriptionId: string): Promise<UserSubscription>
   
   // Автоматический откат на Free при expiration (используется в auto-downgrade job)
   export async function downgradeToFreeIfExpired(userId: string): Promise<boolean>
   ```

4. **Функции для проверки прав доступа (feature gating):**
   
   ```typescript
   // Проверить, имеет ли пользователь доступ к feature
   export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean>
   
   // Проверить, не превышен ли лимит запросов
   export async function canMakeAssistantRequest(userId: string): Promise<boolean>
   
   // Получить информацию о текущем плане пользователя (для отображения в UI)
   export async function getUserPlanInfo(userId: string): Promise<{
     planName: string;
     tier: PlanTier;
     daysUntilExpiry: number | null;
     requestsThisMonth: number;
     maxRequests: number | null;
   }>
   ```

5. **Функции для работы с платежами:**
   
   ```typescript
   // Создать запись о платеже (вызывается при инициировании платежа через Stripe)
   export async function createPayment(
     userId: string,
     subscriptionId: string,
     amount: number,
     externalPaymentId?: string
   ): Promise<Payment>
   
   // Обновить статус платежа (вызывается из webhook'а Stripe)
   export async function updatePaymentStatus(
     paymentId: string,
     status: PaymentStatus,
     failureReason?: string
   ): Promise<Payment>
   
   // Загрузить историю платежей пользователя
   export async function loadPaymentHistory(userId: string): Promise<Payment[]>
   ```

6. **Реализационные детали:**
   
   - Использовать prisma.$transaction для операций, затрагивающих несколько таблиц
   - Все функции должны проверять `if (!prisma)` в начале
   - Для downgradeToFreeIfExpired: загрузить Free план один раз в начале (getFreePlan)
   - Для hasFeatureAccess: если подписка null или expired, вернуть false
   - Для canMakeAssistantRequest: считать запросы за текущий месяц (createdAt >= start of month)
   - Для getUserPlanInfo: вернуть null в любом из полей если подписка не найдена/истекла

7. **Обработка ошибок:**
   
   Все функции должны выбросить Error с понятным сообщением, не молча вернуть null:
   - "Database connection unavailable" (если prisma недоступна)
   - "Plan not found" (если планируемый план не существует)
   - "Free plan not found (data inconsistency)" (если Free план почему-то удален)

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - Никаких ошибок в billingRepository.ts
   - Ошибки в api/**, workspace/** ожидаемы (не обновлены)

2. **`npx eslint src/repositories/billingRepository.ts`**
   - Должен пройти без ошибок

3. **`npx prettier --check src/repositories/billingRepository.ts`**
   - Должен пройти без ошибок

4. **Ручная проверка функций (если есть запущенная БД):**
   
   Можно использовать `psql` для создания тестовых данных:
   ```sql
   INSERT INTO plan (id, name, tier, price, "isActive") 
   VALUES ('plan_free', 'Free', 'free', 0, true);
   
   SELECT * FROM plan;
   ```
   
   Затем импортировать billingRepository в Node REPL и вызвать:
   ```typescript
   const { getFreePlan } = require('./repositories/billingRepository');
   getFreePlan().then(console.log);
   ```

## Stop Condition

Не создавать Step-04 без проверки, что все функции типизированы и экспортированы.
