id: Sprint-31-Step-02
name: "Prisma schema: Plan, UserSubscription, Payment сущности + миграция"
type: implementation

## Контекст

Step-01 (ADR-0016) заморозил архитектурное решение:
- Plan: instance-wide конфигурация тарифных планов
- UserSubscription: привязка пользователя к плану с периодом действия
- Payment: логирование попыток оплаты
- Auto-downgrade механизм на основе endDate

Этот step ИСКЛЮЧИТЕЛЬНО о Prisma schema и миграции. Никакого TypeScript-кода, 
никакого API-роута, никакого контроллера, никакого UI. Только:
1. Добавить enum PlanTier, SubscriptionStatus, PaymentStatus в schema.prisma
2. Добавить model Plan в schema.prisma
3. Добавить model UserSubscription в schema.prisma
4. Добавить model Payment в schema.prisma
5. Запустить `prisma migrate dev --name add-billing` из apps/studio/
6. Проверить, что миграция создалась и применилась

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/prisma/schema.prisma (добавить три model, три enum)
- apps/studio/prisma/migrations/ (новая папка с миграцией, создаётся автоматически)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (это Step-03)
- apps/studio/src/app/api/** (это Step-04)
- apps/studio/src/workspace/** (это Step-05)
- apps/studio/src/components/** (это Step-06)
- Любой TypeScript-код или конфигурация

## Rules

1. **Enum definitions (перед model definitions):**
   
   ```prisma
   enum PlanTier {
     free
     pro
     enterprise
   }
   
   enum SubscriptionStatus {
     active
     expired
     canceled
     past_due
   }
   
   enum PaymentStatus {
     pending
     succeeded
     failed
     refunded
   }
   ```

2. **Plan model:**
   
   ```prisma
   model Plan {
     id                    String   @id @default(cuid())
     name                  String   @unique            // "Free", "Pro", "Enterprise"
     tier                  PlanTier @unique            // enum for gating
     price                 Int      @default(0)        // USD cents (0 for free)
     billingPeriodDays     Int      @default(30)       // 30 для месячного, 365 для годового
     maxAssistantRequests  Int      @default(0)        // 0 = unlimited
     maxCharactersPerReq   Int      @default(0)        // 0 = unlimited
     features              String[] @default([])       // JSON array: ["expert_critique", ...]
     description           String?
     isActive              Boolean  @default(true)     // can users subscribe?
     createdAt             DateTime @default(now())
     updatedAt             DateTime @updatedAt
     subscriptions         UserSubscription[]          // обратная ссылка
     payments              Payment[]                   // обратная ссылка
   }
   ```

3. **UserSubscription model:**
   
   ```prisma
   model UserSubscription {
     id                      String             @id @default(cuid())
     userId                  String
     user                    User               @relation(fields: [userId], references: [id], onDelete: Cascade)
     planId                  String
     plan                    Plan               @relation(fields: [planId], references: [id])
     status                  SubscriptionStatus @default(active)
     startDate               DateTime           @default(now())
     endDate                 DateTime?          // null = forever (for free tier)
     externalSubscriptionId  String?            // Stripe subscription ID, etc.
     createdAt               DateTime           @default(now())
     updatedAt               DateTime           @updatedAt
     payments                Payment[]          // обратная ссылка
   
     // Уникальность: одна активная подписка на пользователя (мягко через status != canceled)
     @@unique([userId], map: "unique_active_subscription_per_user")
     @@index([userId, status])
   }
   ```

4. **Payment model:**
   
   ```prisma
   model Payment {
     id                      String        @id @default(cuid())
     userId                  String
     user                    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
     userSubscriptionId      String
     subscription            UserSubscription @relation(fields: [userSubscriptionId], references: [id], onDelete: Cascade)
     amount                  Int           // USD cents
     status                  PaymentStatus @default(pending)
     externalPaymentId       String?       // Stripe payment intent/charge ID
     paymentMethod           String?       // "card", "paypal", etc.
     failureReason           String?       // reason if status = failed
     createdAt               DateTime      @default(now())
     updatedAt               DateTime      @updatedAt
   
     @@index([userId, status])
     @@index([userSubscriptionId])
   }
   ```

5. **User relation updates:**
   
   Добавить в существующий model User:
   
   ```prisma
   subscriptions  UserSubscription[]  // новое: подписки пользователя
   payments       Payment[]           // новое: платежи пользователя
   ```

6. **Миграция:**
   
   Запустить из apps/studio/:
   ```bash
   npx prisma migrate dev --name add-billing
   ```
   
   Миграция должна создаться в apps/studio/prisma/migrations/, например:
   `20260712XXXXXX_add_billing/migration.sql`
   
   Миграция должна содержать:
   - CREATE TABLE plan
   - CREATE TABLE user_subscription
   - CREATE TABLE payment
   - ALTER TABLE "User" ADD subscriptions, payments relations
   - CREATE INDEX на (userId, status) и (userId)

## Validation

Все команды из apps/studio/:

1. **`npx prisma migrate dev --name add-billing`**
   - Успешный запуск без ошибок
   - Новая миграция создана в apps/studio/prisma/migrations/
   - Schema.prisma обновлена

2. **`npx tsc --noEmit`**
   - Ошибки в repository/**, api/**, workspace/** ожидаемы (они не обновлены)
   - Никаких других ошибок, связанных со схемой

3. **Проверка базы (если есть postgres):**
   ```bash
   psql literary_studio -c "\dt"
   # Должны быть таблицы: plan, user_subscription, payment
   
   psql literary_studio -c "\d plan"
   psql literary_studio -c "\d user_subscription"
   psql literary_studio -c "\d payment"
   ```

4. **npm run build**
   - Должна собраться без ошибок
   - Предупреждения о неиспользованных relations ожидаемы

## Stop Condition

Не создавать Step-03 без подтверждения, что миграция успешно применилась 
к базе и schema.prisma обновлена.
