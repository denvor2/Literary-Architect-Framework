id: Sprint-31-Step-01
name: "ADR-0016: Модель тарифов, оплата и автоматический откат"
type: adr

## Контекст

Sprint 30 завершил мультипользовательскую систему с ролями Admin/User. Теперь необходимо добавить 
систему тарифов для монетизации и гейтинга функциональности.

ADR-0013 (Assistant Settings) оставил открытым вопрос о гейтинге: явное разрешение (permission flag) 
vs тариф/подписка (subscription tier). Sprint 31 решает: гейтинг работает по активному тарифу пользователя.

## Decision

### 1. Модель тарифов

Тарифные планы (Plans) — instance-wide конфигурация:

- id: string (CUID)
- name: string ("Free", "Pro", "Enterprise")
- tier: enum ("free" | "pro" | "enterprise") для программного гейтинга
- price: number (USD cents, 0 для free)
- billingPeriodDays: number (30 месячный, 365 годовой)
- maxAssistantRequests: number (лимит за период, 0 = unlimited)
- features: string[] (JSON: ["expert_critique", "custom_prompts", ...])
- isActive: boolean (можно ли подписаться)

### 2. Пользовательские подписки (UserSubscription)

- id: string (CUID)
- userId: string (FK, cascade delete)
- planId: string (FK)
- status: enum ("active" | "expired" | "canceled" | "past_due")
- startDate, endDate: DateTime (null endDate = forever)
- externalSubscriptionId: string? (Stripe subscription ID)

Индекс: (userId, status) для быстрого поиска активной подписки.

### 3. История платежей (Payment)

- id, userId, userSubscriptionId, amount (USD cents)
- status: enum ("pending" | "succeeded" | "failed" | "refunded")
- externalPaymentId: string? (Stripe charge/intent ID)
- paymentMethod, failureReason: опциональные

### 4. Автоматический откат (Auto-downgrade)

- Проверка endDate <= now() (регулярно или при login)
- Смена статуса на "expired"
- Назначение Free плана пользователю
- Логирование события
- Данные пользователя НЕ удаляются, права ограничиваются

### 5. Платёжный провайдер (ОТКРЫТЫЙ ВОПРОС для PO)

Варианты:
- **Stripe** (рекомендуется): стандартный, free tier, webhook поддержка
- **PayPal**: альтернатива
- **Paddle**: хорошо для EU (VAT)

Рекомендация: Stripe. Требуется подтверждение PO.

### 6. Feature gating и request limits

При runtime (assistant запрос):
- Проверка activeSubscription пользователя
- Проверка лимитов (maxAssistantRequests) и features в плане
- Если превышено — 403 Forbidden

## Consequences

- 3 новых Prisma model: Plan, UserSubscription, Payment
- Enum: PlanTier (free, pro, enterprise)
- Repository: billingRepository.ts
- API endpoints: /api/billing/*
- Controller: useBillingController
- UI: Plan selection, payment form, current plan display
- Auto-downgrade job (scheduler или lazy check)
- Logging: события подписки (для Sprint 32)

## Known Gaps

1. Платёжный провайдер: выбор PO
2. Scheduler: external job service или lazy check?
3. Refund policy: out of scope
4. Tax/VAT: зависит от провайдера

## Stop Condition

Не создавать Step-02 без явного подтверждения PO на выбор платёжного провайдера.
