# ADR-0016: Tariff-Based Subscription Model & Billing Architecture

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** Product Owner (Денис Воробьев), Programmer (Executor)
- **Relates to:** [ADR-0015](ADR-0015-multi-user-authentication.md) (Multi-User Auth & Roles),
  [ADR-0013](ADR-0013-assistant-settings.md) (Assistant Settings — gating model),
  [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack Strategy),
  [ROADMAP_18-27.md](../../project/ROADMAP_18-27.md) (Sprint 31 — Tariff Plans, Billing, Subscriptions),
  [docs/legal/TERMS_OF_SERVICE.md](../legal/TERMS_OF_SERVICE.md) (No-Refunds Policy — section 4)

## Context

Sprint 30 completed the multi-user authentication system (ADR-0015) with Admin/User roles. Now
Sprint 31 must add a tariff-based subscription model to enable platform monetization and
feature-gating by subscription tier.

ADR-0013 (Assistant Settings) explicitly deferred the gating model: permission flag (`allow_override`
boolean) vs subscription tier. Sprint 31 resolves this: **gating is by active user subscription
tier, not by a separate permission flag.**

Product Owner has confirmed the following design decisions on 2026-07-12:

1. **Payment provider:** Yookassa (primary) or Tbank (equivalent) — real integration on Sprint 40+
   (Phase 2); Phase 1 is a placeholder with API structure ready but no real payment processing.
2. **Auto-downgrade scheduler:** Cron job (daily, 00:00 UTC), running in-process in Phase 1.
3. **Refund policy:** No refunds — all payments are final (documented in TERMS_OF_SERVICE.md,
   section 4). Platform takes no refund requests; subscription runs until `endDate`.

This ADR freezes the architectural shape of the billing system (three Prisma entities, auto-downgrade
logic, gating mechanism, payment provider structure, and refund policy) before implementation Step
Cards (Step-02 onward) are executed.

## Decision

### 1. Tier Model — Plan Entity (Instance-Wide Configuration)

A **Plan** represents a subscription tier with fixed features, request limits, and pricing.
Examples: "Free", "Premium", "Pro". Plans are created and managed by Admin; Users subscribe to
existing plans.

```
Plan {
  id: string                    // CUID, globally unique
  name: string                  // "Free", "Premium", "Pro"
  tier: enum ("free" | "premium" | "pro")  // for programmatic gating
  price_monthly: number         // USD cents (0 for Free tier)
  billingPeriodDays: number     // 30 for monthly, 365 for yearly
  maxAssistantRequests: number  // daily limit (0 = unlimited)
  features: string[]            // JSON array, e.g., ["expert_critique", "custom_prompts"]
  isActive: boolean             // can users subscribe to this plan right now?
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Key fields:**

- `tier` enum ensures programmatic gating logic can check `subscription.plan.tier === "premium"` (or
  similar) without string comparison
- `price_monthly` in USD cents (multiply by 100 to avoid floating-point rounding errors)
- `maxAssistantRequests` per day — enforced at runtime when user calls assistant endpoints
- `features` is a JSON array of feature string IDs (e.g., `["critic", "reader", "coauthor"]`) —
  allows UI to decide which assistants are available
- `isActive` allows Admin to soft-disable a plan (e.g., "Pro" while it's in beta) without deleting
  it

**Predefined Plans (seeded on first migration):**

- **Free:** tier="free", price=0, maxAssistantRequests=10/day, features=["critic", "reader"]
- **Premium:** tier="premium", price=999 (USD 9.99/month), maxAssistantRequests=100/day,
  features=["critic", "reader", "coauthor", "line_editor", "settings_override"]
- **Pro:** tier="pro", price=2999 (USD 29.99/month), maxAssistantRequests=0 (unlimited),
  features=["critic", "reader", "coauthor", "line_editor", "settings_override", "priority_support"]
  (deferred to future)

### 2. User Subscription Entity (Per-User Subscription State)

A **UserSubscription** tracks a single user's subscription to a Plan: which plan they're on, when
it started/ends, and what status it has (active, expired, cancelled, past-due).

```
UserSubscription {
  id: string                         // CUID
  userId: string (FK)                // foreign key to User, cascade delete
  planId: string (FK)                // foreign key to Plan
  status: enum ("active" | "expired" | "cancelled" | "past_due")
  startDate: DateTime                // when subscription began
  endDate: DateTime | null           // when subscription ends; null = never expires
  externalSubscriptionId: string?    // Yookassa/Tbank subscription ID (Phase 2)
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Key fields:**

- `userId` cascade delete ensures if a user is deleted, their subscriptions are cleaned up
- `status` tracks subscription lifecycle: "active" (current, not expired), "expired" (endDate has
  passed), "cancelled" (user canceled), "past_due" (payment failed, reserved for Phase 2)
- `endDate` nullable: `null` means the subscription never expires (e.g., Free tier with no end
  date; premium subscriptions always have endDate set)
- `externalSubscriptionId` links to the payment provider's subscription record (Phase 2)

**Index:** `(userId, status)` for fast "find the active subscription for user X" queries.

**Default subscription on user creation:** Every new user gets a Free plan subscription with
`endDate = null` (permanent until they upgrade).

### 3. Payment Entity (Audit Trail & Invoice History)

A **Payment** record tracks every payment attempt, success, or failure. Used for invoice history,
compliance, and debugging.

```
Payment {
  id: string                          // CUID
  userSubscriptionId: string (FK)     // which subscription is this payment for?
  userId: string (FK)                 // denormalized for quick user lookup (audit queries)
  amount: number                      // USD cents (e.g., 999 for $9.99)
  status: enum ("pending" | "completed" | "failed" | "refunded")
  provider: enum ("yookassa" | "tbank")  // which payment provider processed this
  externalPaymentId: string?          // Yookassa charge ID, Tbank payment ID, etc.
  failureReason: string?              // error message if status="failed"
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Key fields:**

- `userSubscriptionId` links payment to subscription (may be 1-to-many: multiple retry attempts)
- `userId` denormalized because payment audit queries typically start with "show me all payments
  for user X"
- `status` lifecycle: "pending" (awaiting provider response), "completed" (money received),
  "failed" (provider rejected), "refunded" (money returned — not used in Phase 1, reserved for
  future)
- `provider` enum ensures easy reporting (e.g., "which payments went through Yookassa vs Tbank")
- `externalPaymentId` is the provider's transaction ID; critical for reconciliation and support
  troubleshooting

**No `refund_amount` field:** By design, the schema does not support refunds. If a refund is
needed in the future, it requires a separate ADR and schema extension.

### 4. Automatic Downgrade Mechanism (Auto-Downgrade on Expiration)

Every day at 00:00 UTC, a Cron job runs the following check:

```
SELECT UserSubscription WHERE endDate IS NOT NULL AND endDate <= now()
FOR EACH subscription:
  IF subscription.status != 'expired' AND subscription.status != 'cancelled':
    UPDATE UserSubscription SET
      planId = (SELECT id FROM Plan WHERE tier = 'free'),
      status = 'expired',
      updatedAt = now()
    WHERE id = subscription.id
    
    INSERT INTO BillingEvent (userId, subscriptionId, eventType, createdAt)
    VALUES (subscription.userId, subscription.id, 'auto_downgrade', now())
```

**Key aspects:**

- **Daily check:** runs at fixed time (00:00 UTC), not on every request (simpler, more predictable)
- **Idempotent:** if a subscription is already "expired", the check skips it (prevents duplicate
  events)
- **Data preservation:** user's books, chapters, scenes, characters, ideas are NOT deleted when
  downgraded — only rights/access are reduced
- **Logging:** event is inserted into `BillingEvent` table (introduced in Sprint 32) for audit
  trail and transparency
- **Fallback for lazy evaluation:** if Cron job misses a day (e.g., server downtime), the first
  assistant API call the user makes will also check and auto-downgrade them mid-request (does not
  block the request, but logs it)

**For Phase 1:** Simple Node.js `node-cron` package running in-process. Phase 2 or later can
externalize this to a dedicated job service (Bull Queue, AWS Lambda) without schema changes.

### 5. Payment Provider Structure (Phase 1 Placeholder + Phase 2 Real Integration)

Product Owner confirmed **Yookassa** as primary, **Tbank** as secondary backup.

#### Phase 1 (This Sprint — Placeholder Only)

- **API endpoint structure:** `POST /api/billing/subscribe` is defined and documented
- **Request body:** includes `planId`, optional `billingPeriodDays` for annual subscription
- **Response (Phase 1 mock):** always returns `{ success: true, subscriptionId: "...", startDate,
  endDate }`
- **Database action:** creates `UserSubscription` record with `status = 'pending'` and
  `externalSubscriptionId = null` (not yet linked to real provider)
- **Demo mode:** no real money is processed; endpoint logs a message and returns success for UI
  testing

#### Phase 2 (Sprint 40+ — Real Integration)

- **Yookassa API call:** when user submits payment form, call Yookassa API to create a payment or
  subscription
- **Token handling:** Yookassa returns `externalPaymentId`; store it in `Payment.externalPaymentId`
- **Webhook verification:** Yookassa sends webhook events (e.g., `payment.succeeded`,
  `payment.failed`); server verifies webhook signature and updates `Payment.status` accordingly
- **Auto-renewal:** Yookassa manages recurring billing; if auto-renew fails, Yookassa sends
  `payment.failed` webhook; server updates `UserSubscription.status = 'past_due'` and auto-downgrade
  job handles the rest
- **Currency:** RUB (rubles) — default for Yookassa and Tbank; pricing in Phase 1 is in USD for
  documentation clarity; Phase 2 converts to RUB at current rate or fixed via config

**Webhook URL structure (to be implemented in Phase 2):**

```
POST /api/billing/webhook
{
  "type": "payment.succeeded" | "payment.failed" | "subscription.cancelled",
  "paymentId": "...",
  "subscriptionId": "...",
  "amount": number,
  "timestamp": ISO 8601 string
}
```

### 6. Feature Gating & Request Limits (Runtime Enforcement)

When a user calls any assistant endpoint (e.g., `/api/critic`, `/api/reader`), the middleware
performs the following check:

```
1. Fetch currentUser from auth cookie (middleware provides this)
2. Query: SELECT UserSubscription WHERE userId = currentUser.id AND status = 'active' ORDER BY updatedAt DESC LIMIT 1
3. If no active subscription found:
     - User must be on Free tier; use hardcoded Free plan limits
4. If active subscription found:
     - Load Plan details from subscription.planId
5. Rate-limit check:
     - Query: COUNT assistant calls by user today (from logging table or request cache)
     - If count >= plan.maxAssistantRequests:
         - Return 403 Forbidden { error: "Daily request limit exceeded", limit: N, used: N }
6. Feature check:
     - If request.type (e.g., "critic") not in plan.features:
         - Return 403 Forbidden { error: "This feature is not available in your plan", plan: currentPlan.name }
7. If all checks pass: allow request to proceed
```

**Consequences:**

- Free users: 10 requests/day, only Critic and Reader assistants
- Premium users: 100 requests/day, all assistants, can override settings
- Pro users: unlimited requests, all assistants, priority support

**Error messages are transparent:** user sees clear message (not a generic 403) so they understand
they need to upgrade.

### 7. No-Refunds Policy (Documented in TERMS_OF_SERVICE.md)

From `docs/legal/TERMS_OF_SERVICE.md` section 4:

> **All payments are final and non-refundable.** Refunds are not issued under any circumstances,
> including:
> - Cancellation of subscription mid-period
> - Non-use of request limits
> - Technical issues or service interruptions

**Architectural consequences:**

- `Payment` schema has NO `refund_amount` field
- `Payment.status` does not support "refunded" state in Phase 1 (reserved for future if policy
  changes)
- If a refund is genuinely required (e.g., fraud, accidental duplicate charge), it must be handled
  out-of-band (manual Yookassa/Tbank refund + notification to user)
- No admin UI for refunds in Phase 1

### 8. Migration & Seeding

On first run (or via `prisma migrate deploy`), the system:

1. Creates the three new Prisma tables: `Plan`, `UserSubscription`, `Payment`
2. Seeds the `Plan` table with Free, Premium, and Pro plans
3. For each existing user (from Sprint 30), creates a default `UserSubscription` with `planId =
   Free.id`, `status = 'active'`, `endDate = null`

**Seed data (prisma/seed.ts or similar):**

```typescript
const freePlan = await prisma.plan.create({
  data: {
    name: "Free",
    tier: "free",
    price_monthly: 0,
    billingPeriodDays: 30,
    maxAssistantRequests: 10,
    features: ["critic", "reader"],
    isActive: true,
  },
});

const premiumPlan = await prisma.plan.create({
  data: {
    name: "Premium",
    tier: "premium",
    price_monthly: 999,  // $9.99
    billingPeriodDays: 30,
    maxAssistantRequests: 100,
    features: ["critic", "reader", "coauthor", "line_editor", "settings_override"],
    isActive: true,
  },
});

// Migrate existing users
for (const user of await prisma.user.findMany()) {
  const existingSub = await prisma.userSubscription.findFirst({
    where: { userId: user.id },
  });
  if (!existingSub) {
    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        status: "active",
        startDate: new Date(),
        endDate: null,
      },
    });
  }
}
```

## Consequences

- **Prisma schema:** extends with three new models (`Plan`, `UserSubscription`, `Payment`); adds
  enums (`PlanTier`, `SubscriptionStatus`, `PaymentStatus`, `PaymentProvider`)
- **Database migration:** `prisma migrate dev --name add_billing` creates tables, indices, foreign
  keys; migration is idempotent (can be re-applied safely)
- **Repository layer:** new file `apps/studio/src/repositories/billingRepository.ts` with functions:
  - `getPlanByTier(tier)` — fetch plan by enum
  - `getActiveSubscription(userId)` — fetch current active subscription
  - `getUserSubscriptions(userId)` — list all subscriptions for a user (with status)
  - `createSubscription(userId, planId, billingPeriodDays)` — create new subscription
  - `cancelSubscription(subscriptionId)` — mark as cancelled
  - `createPayment(subscriptionId, amount, provider)` — record payment
  - `updatePaymentStatus(paymentId, status, externalId, failureReason)` — update payment after
    webhook

- **API layer:** new files in `apps/studio/src/app/api/billing/`:
  - `GET /api/billing/plans` — list available plans (public endpoint, no auth required)
  - `GET /api/billing/current` — get current user's active subscription (auth required)
  - `POST /api/billing/subscribe` — create subscription (auth required, Phase 1 returns mock
    success)
  - `POST /api/billing/cancel` — cancel subscription (auth required)
  - `GET /api/billing/history` — payment history (auth required)
  - `POST /api/billing/webhook` — Yookassa webhook (public, signed, Phase 2 only)

- **Domain layer:** new types in `apps/studio/src/domain/model.ts`:
  ```typescript
  export type Plan = { readonly id: string; readonly name: string; readonly tier: "free" | "premium" | "pro"; readonly maxAssistantRequests: number; readonly features: readonly string[]; readonly price_monthly: number; readonly createdAt: string; readonly updatedAt: string; };
  export type UserSubscription = { readonly id: string; readonly userId: string; readonly planId: string; readonly status: "active" | "expired" | "cancelled" | "past_due"; readonly startDate: string; readonly endDate: string | null; readonly createdAt: string; readonly updatedAt: string; };
  ```

- **Workspace Controller:** new file `apps/studio/src/workspace/useBillingController.ts` with hooks:
  - `currentPlan()` — fetch and cache active subscription + plan details
  - `availablePlans()` — fetch list of available plans
  - `subscribe(planId)` — initiate subscription
  - `cancel()` — cancel current subscription
  - `paymentHistory()` — fetch payment records

- **API middleware (gating):** add check to `apps/studio/src/middleware.ts` or a new
  `withBillingGate.ts` middleware:
  - On `/api/critic`, `/api/reader`, `/api/coauthor`, `/api/line_editor`: verify user has active
    subscription and feature is available
  - Daily request limit checked at call time (not pre-computed)

- **UI layer:** new components in `apps/studio/src/components/billing/`:
  - `PlansDialog.tsx` — modal showing available tiers with pricing and "Subscribe" button
  - `SubscriptionPanel.tsx` — current plan display (name, daily limit, expiration, Cancel button)
  - `BillingHistoryDialog.tsx` — list of past payments
  - `UpgradePrompt.tsx` — shown when user hits daily limit ("Upgrade to Premium to continue")

- **Cron job:** new file `apps/studio/scripts/cron-downgrade.ts` or `src/jobs/billingDowngrade.ts`
  - Uses `node-cron` or similar
  - Exports a function to start the daily job
  - Called from `apps/studio/next.config.js` or app startup hook (exact pattern in Step-07)

- **Environment variables:** `.env.local` must include (Phase 2):
  - `YOOKASSA_SHOP_ID` — merchant ID
  - `YOOKASSA_SECRET_KEY` — API secret (keep confidential)
  - `WEBHOOK_SECRET` — for signing webhook payloads

- **Testing & documentation:**
  - `docs/integration/BILLING_FLOW.md` — step-by-step user flow (register → view plans → subscribe
    → get redirected to Yookassa → return → subscription active)
  - Unit tests for `billingRepository.ts` functions (CRUD, queries)
  - Integration tests for `/api/billing/*` endpoints with mock Yookassa responses
  - E2E test: user subscribes to Premium, hits daily limit, gets 403, then can upgrade

## Known Gaps / Phase 2 Blockers

1. **Real payment processing integration** (Phase 2, Sprint 40+, Deferred)
   - Yookassa/Tbank API calls not implemented in Phase 1
   - Webhook verification not implemented in Phase 1
   - Sandbox testing credentials need to be obtained and documented
   - PCI compliance review (Yookassa handles PCI; server never sees full card)

2. **Email notifications** (Phase 2, Sprint 32 or later, Deferred)
   - Subscription confirmation email
   - Expiration reminder (7 days before)
   - Auto-downgrade notification
   - Failed payment alert
   - Requires SMTP infrastructure (SendGrid, Mailgun, etc.)
   - Requires email templates and localization (Russian + English)

3. **VAT/Tax handling** (Phase 2, Deferred)
   - Russian VAT (18% or 20%) may apply depending on customer type
   - Yookassa automatically handles VAT for Russian customers
   - Tbank also handles VAT
   - Phase 1: ignore VAT; Phase 2: review Yookassa/Tbank billing statements for VAT breakdown
   - Document in `docs/legal/TAX_POLICY.md` (placeholder for Phase 2)

4. **Refund handling** (EXPLICITLY NOT SUPPORTED, documented in TERMS_OF_SERVICE.md)
   - All payments are final — no refunds issued
   - If refund is required in the future, it requires separate ADR and schema changes
   - Out-of-band refunds (manual Yookassa call + user notification) are the only option until
     refund support is explicitly designed

5. **Subscription upgrade/downgrade mid-period** (Phase 2, Deferred)
   - Phase 1 only supports: subscribe (new subscription) or cancel (no more payments after
     endDate)
   - Mid-period plan changes (Free → Premium immediately, or Premium → Pro immediately) deferred
   - Proration of unused time not implemented
   - Requires separate business logic in Phase 2

6. **Scheduler implementation externalization** (Phase 1 uses in-process Cron, Phase 2 optional)
   - Phase 1: simple Node.js `node-cron` in app process
   - Phase 2 option: externalize to Bull Queue (Redis-based), AWS Lambda, or dedicated job service
   - Schema supports this (no migration needed if implementation changes)

7. **Plan customization per user** (NOT SUPPORTED, by design)
   - Plans are instance-wide, global configuration
   - Each user subscribed to one of the predefined plans (Free/Premium/Pro)
   - Custom per-user plans (e.g., "user@example.com gets unlimited Critic but limited Reader")
     are out of scope and would require a separate ADR

8. **Multi-year subscriptions** (Deferred, Phase 2)
   - Phase 1 only supports monthly subscriptions (30-day `billingPeriodDays`)
   - Yearly subscriptions (365-day) can be added later with discount pricing (e.g., Premium yearly
     at $99/year instead of $9.99/month)
   - Schema supports it; business logic not implemented

9. **Discount codes / coupons** (Not supported in Phase 1, Deferred)
   - Admin ability to issue discount codes or apply them to users
   - Promo codes, trial periods, referral bonuses
   - Requires separate ADR and schema (Coupon model, UserCoupon join table)

10. **Subscription analytics & reporting** (Deferred to Phase 2 or later)
    - Admin dashboard showing: active subscribers by plan, MRR (monthly recurring revenue), churn
      rate
    - Yookassa provides reporting; phase 2 can add internal analytics

## References

- [ADR-0015](ADR-0015-multi-user-authentication.md) — Multi-User Auth System & Roles (foundation
  for per-user subscriptions)
- [ADR-0013](ADR-0013-assistant-settings.md) — Assistant Settings & Gating (resolves open question
  about permission model)
- [ADR-0003](ADR-0003-technology-stack-strategy.md) — Technology Stack Strategy (Prisma, Node.js,
  PostgreSQL)
- [ROADMAP_18-27.md](../../project/ROADMAP_18-27.md) — Sprint 31 Requirements & Definition of Done
  (lines 358–385)
- [docs/legal/TERMS_OF_SERVICE.md](../legal/TERMS_OF_SERVICE.md) — User Agreement (No-Refunds
  Policy, section 4)
- **Yookassa API docs:** https://yookassa.ru/developers/api (Phase 2 reference)
- **Tbank Payment API docs:** https://www.tbank.ru/api (Phase 2 reference)

## Stop Condition

Do NOT proceed with Step-02 (Prisma schema migration) until this ADR is accepted by Product Owner.

If Product Owner's decision differs from the options documented above (e.g., different payment
provider, different plan names/limits, different auto-downgrade frequency, different refund
policy), update this ADR and re-document before Step-02 executes.

**Confirmed by Product Owner (2026-07-12):**
- Payment provider: Yookassa/Tbank ✓
- Auto-downgrade: Daily Cron, 00:00 UTC ✓
- No-refunds policy: All payments final ✓
- Phase 1: Placeholder only, no real payment processing ✓
- Phase 2: Sprint 40+ for real integration ✓
