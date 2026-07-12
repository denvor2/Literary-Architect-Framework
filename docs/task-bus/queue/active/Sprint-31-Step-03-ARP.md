id: Sprint-31-Step-03-ARP
date: 2026-07-12
status: ready-for-review

## Что сделано

Реализован repository слой для работы с тарифами, подписками и платежами согласно ADR-0016 и требованиям Step Card Sprint-31-Step-03.

### Основные артефакты

1. **apps/studio/src/repositories/billingRepository.ts** — новый файл с 14 экспортируемыми функциями:
   - **Функции работы с планами** (3):
     - `loadActivePlans()` — загрузить все активные тарифные планы
     - `loadPlan(planId)` — загрузить конкретный план по ID
     - `getFreePlan()` — загрузить Free план (гарантированно существует)
   
   - **Функции работы с подписками** (5):
     - `loadActiveSubscription(userId)` — загрузить активную подписку с план-данными (тип ActiveSubscription)
     - `createSubscription(userId, planId, externalSubscriptionId?)` — создать новую подписку
     - `updateSubscription(subscriptionId, planId, endDate?)` — обновить подписку (для upgrade/downgrade)
     - `cancelSubscription(subscriptionId)` — отменить подписку (status='cancelled')
     - `downgradeToFreeIfExpired(userId)` — автоматический откат на Free при expiration (для cron-job)
   
   - **Функции проверки прав доступа (feature gating)** (3):
     - `hasFeatureAccess(userId, feature)` — проверить доступ к конкретной функции
     - `canMakeAssistantRequest(userId)` — проверить лимит запросов за месяц
     - `getUserPlanInfo(userId)` — получить информацию о текущем плане (для UI)
   
   - **Функции работы с платежами** (3):
     - `createPayment(userId, subscriptionId, amount, externalPaymentId?)` — создать запись о платеже
     - `updatePaymentStatus(paymentId, status, failureReason?)` — обновить статус платежа (из webhook)
     - `loadPaymentHistory(userId)` — загрузить историю платежей пользователя

2. **apps/studio/src/repositories/index.ts** — обновлен для экспорта 14 функций и типа `ActiveSubscription` из billingRepository

### Реализационные детали

- **Проверки и обработка ошибок:**
  - Все функции проверяют `if (!prisma)` в начале → `throw "Database connection unavailable"`
  - `getFreePlan()` → `throw "Free plan not found (data inconsistency)"` если план не найден
  - `createSubscription()`, `updateSubscription()` → `throw "Plan not found"` если планируемый план не существует
  - Остальные функции возвращают null/false в безопасных случаях (user not found, no subscription)

- **Бизнес-логика:**
  - `loadActiveSubscription()` возвращает тип `ActiveSubscription` (subscription + plan вместе)
  - `createSubscription()` автоматически вычисляет `endDate` из `plan.billingPeriodDays` (кроме Free tier)
  - `downgradeToFreeIfExpired()` использует транзакцию для атомарного обновления
  - `hasFeatureAccess()` проверяет: active subscription + не expired + feature in plan.features
  - `canMakeAssistantRequest()` считает платежи за текущий месяц (createdAt >= start of month)
  - `getUserPlanInfo()` возвращает полное информационное объект для UI (planName, tier, daysUntilExpiry, requestsThisMonth, maxRequests)

- **Типизация:**
  - Экспортирован тип `ActiveSubscription = { subscription: UserSubscription; plan: Plan }`
  - Используются встроенные типы Prisma: `Plan`, `UserSubscription`, `Payment`, `PlanTier`, `PaymentStatus`
  - Все функции правильно типизированы с Promise-обёртками

## Валидация

Все команды выполнены из `apps/studio/`:

1. ✅ **npx tsc --noEmit**
   - Никаких ошибок в billingRepository.ts и index.ts
   - Вся типизация корректна

2. ✅ **npx eslint src/repositories/billingRepository.ts**
   - Нет ошибок и предупреждений (удалён неиспользуемый import `SubscriptionStatus`)

3. ✅ **npx prettier --check src/repositories/billingRepository.ts**
   - Форматирование исправлено (prettier --write)
   - Все файлы соответствуют стилю проекта

4. ✅ **npm run build**
   - Сборка успешна за 2.1s
   - Все маршруты скомпилированы (19 static/dynamic routes)
   - TypeScript финализирован без ошибок

## Соответствие Scope

- ✅ **Allowed paths:**
  - `apps/studio/src/repositories/billingRepository.ts` — создан
  - `apps/studio/src/repositories/index.ts` — обновлён для экспорта

- ✅ **Forbidden paths:**
  - `apps/studio/src/repositories/userRepository.ts` — не трогался
  - `apps/studio/src/app/api/**` — не трогался (это Step-04)
  - Никакой UI-код — не трогался (это Step-05-06)

- ✅ **Git status --short:**
  - Только разрешённые файлы модифицированы/созданы
  - Миграции Prisma (untracked) — не мои, заранее созданы
  - Удаления из pending — ожидаемы (Step-01/02 уже в active, Step-03 перемещён)

## Отклонения от Step Card

Нет. Реализованы все 14 функций в точности согласно требованиям.

## Stop Condition

✅ Достигнут. Repository layer готов к Step-04 (API endpoints). Все функции типизированы, экспортированы, протестированы валидаторами (tsc, eslint, prettier, build).

**ARP не коммичится и ожидает `STATUS: OK` от архитектора.**
