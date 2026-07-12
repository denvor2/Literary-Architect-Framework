id: Sprint-31-Step-04
name: "API endpoints для биллинга: /api/billing/*"
type: implementation

## Контекст

Step-03 завершил repository слой. Теперь нужны HTTP endpoints для:
- Загрузки текущего плана пользователя (для UI display)
- Инициирования подписки (интеграция с Stripe Payment Element)
- Получения истории платежей
- Обновления статуса платежей (webhook от Stripe)
- Admin endpoints для управления планами (список, создание, обновление)

Эти endpoints используются из контроллера (Step-05) и UI (Step-06).

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/app/api/billing/ (новая папка)
- apps/studio/src/app/api/billing/route.ts (GET все планы, POST создать план — админ)
- apps/studio/src/app/api/billing/plan/route.ts (GET текущий план пользователя)
- apps/studio/src/app/api/billing/subscribe/route.ts (POST инициировать подписку)
- apps/studio/src/app/api/billing/payments/route.ts (GET история платежей)
- apps/studio/src/app/api/billing/payment/[id]/route.ts (PUT update статус — webhook)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (не трогать)
- apps/studio/src/workspace/** (это Step-05)
- apps/studio/src/components/** (это Step-06)

## Rules

1. **GET /api/billing**
   
   Возвращает список всех активных тарифных планов (для UI выбора).
   
   ```typescript
   // Response (200)
   {
     ok: true,
     plans: [
       { id, name, tier, price, billingPeriodDays, maxAssistantRequests, features, description }
     ]
   }
   ```
   
   Public endpoint (не требует auth, информация о планах должна быть видна всем).

2. **GET /api/billing/plan**
   
   Возвращает текущий активный план пользователя.
   
   ```typescript
   // Request: (cookies с JWT, middleware проверяет auth)
   // Response (200)
   {
     ok: true,
     subscription: {
       id, planId, status, startDate, endDate, externalSubscriptionId
     },
     plan: {
       id, name, tier, price, billingPeriodDays, maxAssistantRequests, features
     }
   }
   
   // Response (404) — если user не имеет подписки (shouldn't happen, должен быть Free)
   { ok: false, error: "No active subscription" }
   ```
   
   Protected endpoint (требует auth).

3. **POST /api/billing/subscribe**
   
   Инициирует новую подписку и возвращает Stripe Payment Intent для фронтенда.
   
   ```typescript
   // Request
   {
     planId: string,
     // future: paymentMethodId (для повторяющихся платежей)
   }
   
   // Response (200)
   {
     ok: true,
     subscription: { id, planId, status, startDate, endDate },
     stripePaymentIntent: {
       clientSecret: string,
       // используется на фронтенде для Stripe Payment Element
     }
   }
   
   // Response (400) — если план невалиден/неактивен
   { ok: false, error: "Invalid plan" }
   
   // Response (402) — если платёж требуется (Stripe)
   { ok: false, error: "Payment required" }
   ```
   
   Protected endpoint (требует auth).

4. **GET /api/billing/payments**
   
   Возвращает историю платежей пользователя (для Account > Billing History).
   
   ```typescript
   // Request: (cookies с JWT)
   // Response (200)
   {
     ok: true,
     payments: [
       {
         id, amount, status, externalPaymentId, paymentMethod, 
         failureReason?, createdAt, subscription: { planId, plan: { name } }
       }
     ]
   }
   ```
   
   Protected endpoint, сортировка по createdAt desc.

5. **PUT /api/billing/payment/[id]**
   
   Обновляет статус платежа (вызывается из webhook'а Stripe).
   
   ```typescript
   // Request (webhook от Stripe, нужна валидация signature)
   {
     paymentId: string (в URL как [id]),
     status: "pending" | "succeeded" | "failed" | "refunded",
     failureReason?: string,
     externalPaymentId?: string
   }
   
   // Response (200)
   { ok: true, payment: { id, status, ... } }
   
   // Response (400) — если платёж не найден
   { ok: false, error: "Payment not found" }
   ```
   
   Webhook endpoint (требует Stripe signature validation — пока placeholder).

6. **POST /api/billing (Admin)**
   
   Создаёт новый тарифный план (только Admin).
   
   ```typescript
   // Request
   {
     name: string,
     tier: "free" | "pro" | "enterprise",
     price: number,
     billingPeriodDays: number,
     maxAssistantRequests: number,
     features: string[],
     description?: string
   }
   
   // Response (201)
   { ok: true, plan: { id, name, tier, price, ... } }
   
   // Response (403) — если не admin
   { ok: false, error: "Admin access required" }
   ```
   
   Protected endpoint (проверка currentUser.role === "admin").

7. **Обработка ошибок:**
   
   Все endpoints должны:
   - Извлечь userId из JWT (middleware уже проверил auth, но нужно распарсить token)
   - Вернуть 401 если JWT невалиден (хотя middleware должен отклонить раньше)
   - Вернуть 403 если попытка несанкционированного доступа (e.g., админ-only)
   - Вернуть 400 если невалидный request body
   - Вернуть 500 если ошибка БД
   - Вернуть 503 если prisma недоступна (как в других endpoints)

8. **Интеграция Stripe (placeholder для Phase 1):**
   
   Пока Stripe интеграция — это placeholder: вместо реального Payment Intent 
   возвращаем mock данные. Step 05 (UI) будет использовать clientSecret 
   для отправки в Stripe Payment Element. Реальная интеграция Stripe SDK — 
   возможно отдельный Step Card или Phase 2.

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - Никаких ошибок в api/billing/**

2. **`npx eslint src/app/api/billing`**
   - Должен пройти без ошибок

3. **`npm run build`**
   - Должна собраться без ошибок

4. **Тестирование endpoints (ручное или e2e):**
   
   ```bash
   # Получить список планов (public)
   curl http://localhost:3000/api/billing
   
   # Получить текущий план (requires auth — передать cookie или Jest/Playwright с auth)
   curl -H "Cookie: auth_token=..." http://localhost:3000/api/billing/plan
   
   # История платежей (requires auth)
   curl -H "Cookie: auth_token=..." http://localhost:3000/api/billing/payments
   ```

## Stop Condition

Не создавать Step-05 без проверки, что все endpoints возвращают корректные JSON 
и обрабатывают ошибки consistentно (как остальные endpoints в проекте).
