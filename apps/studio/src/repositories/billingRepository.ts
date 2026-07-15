// Sprint-31-Step-03: billing repository — subscription management, feature gating,
// and payment tracking. Provides the contract for billing operations used by
// Step-04 (API endpoints), Step-05 (controller), and expert routes (rate limiting).
//
// Key patterns:
// - All functions check `if (!prisma)` at the start
// - ActiveSubscription is the combined subscription + plan object
// - Feature access requires active subscription with matching feature in plan
// - Payment operations track audit trail for compliance

import { prisma } from "@/lib/db";
import type {
  Plan,
  UserSubscription,
  Payment,
  PlanTier,
  PaymentStatus,
} from "@/generated/prisma/client";

/**
 * Combined subscription and plan data — used when checking access and rendering plan info.
 */
export type ActiveSubscription = {
  subscription: UserSubscription;
  plan: Plan;
};

/**
 * Load all active (isActive=true) plans available for subscription.
 * Used for rendering the plans dialog/page.
 * Throws if database is unavailable.
 */
export async function loadActivePlans(): Promise<Plan[]> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Load a single plan by ID.
 * Returns null if plan not found, throws if database is unavailable.
 */
export async function loadPlan(planId: string): Promise<Plan | null> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.plan.findUnique({
    where: { id: planId },
  });
}

/**
 * Load the Free plan (tier=free).
 * Free plan must always exist (seeded at migration).
 * Throws if not found (data inconsistency) or database unavailable.
 */
export async function getFreePlan(): Promise<Plan> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  const freePlan = await prisma.plan.findUnique({
    where: { tier: "free" },
  });
  if (!freePlan) {
    throw new Error("Free plan not found (data inconsistency)");
  }
  return freePlan;
}

/**
 * Load the user's active subscription with plan details.
 * Queries for status='active' (not expired or cancelled).
 * Returns null if user not found or has no active subscription.
 * Throws if database unavailable.
 */
export async function loadActiveSubscription(
  userId: string,
): Promise<ActiveSubscription | null> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: "active",
    },
    include: { Plan: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!subscription) {
    return null;
  }
  return {
    subscription,
    plan: subscription.Plan,
  };
}

/**
 * Create a new subscription for a user to a plan.
 * Throws if plan not found or database unavailable.
 * Sets status='active' and startDate=now() by default.
 * externalSubscriptionId is optional (for Phase 2 Yookassa integration).
 */
export async function createSubscription(
  userId: string,
  planId: string,
  externalSubscriptionId?: string,
): Promise<UserSubscription> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // Verify plan exists
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });
  if (!plan) {
    throw new Error("Plan not found");
  }

  // Calculate endDate based on billingPeriodDays (null for Free tier)
  const now = new Date();
  let endDate: Date | null = null;
  if (plan.tier !== "free") {
    endDate = new Date(
      now.getTime() + plan.billingPeriodDays * 24 * 60 * 60 * 1000,
    );
  }

  const { customAlphabet } = await import("nanoid");
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
  return prisma.userSubscription.create({
    data: {
      id: nanoid(),
      userId,
      planId,
      status: "active",
      startDate: now,
      endDate,
      externalSubscriptionId,
      updatedAt: now,
    },
  });
}

/**
 * Update an existing subscription's plan and/or end date.
 * Throws if subscription not found or database unavailable.
 * Typically used for upgrade/downgrade mid-period (Phase 2 feature).
 */
export async function updateSubscription(
  subscriptionId: string,
  planId: string,
  endDate?: Date,
): Promise<UserSubscription> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // Verify plan exists
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });
  if (!plan) {
    throw new Error("Plan not found");
  }

  // If endDate not provided, calculate it based on plan's billingPeriodDays
  let finalEndDate = endDate;
  if (!finalEndDate && plan.tier !== "free") {
    const now = new Date();
    finalEndDate = new Date(
      now.getTime() + plan.billingPeriodDays * 24 * 60 * 60 * 1000,
    );
  }

  return prisma.userSubscription.update({
    where: { id: subscriptionId },
    data: {
      planId,
      endDate: finalEndDate,
    },
  });
}

/**
 * Cancel a subscription (user-initiated cancellation).
 * Sets status='cancelled'.
 * Throws if subscription not found or database unavailable.
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<UserSubscription> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.userSubscription.update({
    where: { id: subscriptionId },
    data: { status: "cancelled" },
  });
}

/**
 * Auto-downgrade expired subscriptions to Free tier.
 * Checks if endDate <= now() and status != 'expired'/'cancelled'.
 * If expired, updates status='expired' and planId=Free.id.
 * Returns true if downgrade occurred, false if already expired or not found.
 * Throws if database unavailable or Free plan not found.
 */
export async function downgradeToFreeIfExpired(
  userId: string,
): Promise<boolean> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // Load Free plan once at the start
  const freePlan = await getFreePlan();

  // Find the user's subscription
  const subscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!subscription) {
    return false;
  }

  // Check if already expired or cancelled
  if (
    subscription.status === "expired" ||
    subscription.status === "cancelled"
  ) {
    return false;
  }

  // Check if endDate has passed
  const now = new Date();
  if (!subscription.endDate || subscription.endDate > now) {
    return false;
  }

  // Perform downgrade in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.update({
      where: { id: subscription.id },
      data: {
        planId: freePlan.id,
        status: "expired",
      },
    });
  });

  return true;
}

/**
 * Check if a user has access to a specific feature.
 * Returns false if:
 * - No active subscription found
 * - Active subscription is expired
 * - Feature not in plan's features array
 * Returns true only if active subscription exists and feature is available.
 * Throws if database unavailable.
 */
export async function hasFeatureAccess(
  userId: string,
  feature: string,
): Promise<boolean> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  const active = await loadActiveSubscription(userId);
  if (!active) {
    return false;
  }

  // Check if subscription is not actually expired (status=active but endDate has passed)
  const now = new Date();
  if (active.subscription.endDate && active.subscription.endDate <= now) {
    return false;
  }

  return active.plan.features.includes(feature);
}

/**
 * Check if a user can make an assistant request this month.
 * Counts requests by user in the current calendar month.
 * Returns false if:
 * - No active subscription
 * - Daily limit exceeded for this month
 * - maxRequests is 0 (unlimited), returns true
 * Throws if database unavailable.
 */
export async function canMakeAssistantRequest(
  userId: string,
): Promise<boolean> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  const active = await loadActiveSubscription(userId);
  if (!active) {
    return false;
  }

  // If maxRequests is 0, unlimited
  if (active.plan.maxAssistantRequests === 0) {
    return true;
  }

  // Count requests in the current month (only completed payments)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const requestCount = await prisma.payment.count({
    where: {
      userId,
      createdAt: { gte: monthStart },
      status: "completed",
    },
  });

  return requestCount < active.plan.maxAssistantRequests;
}

/**
 * Get plan information for the user's current subscription.
 * Returns null for any field if subscription not found/expired.
 * Throws if database unavailable.
 */
export async function getUserPlanInfo(userId: string): Promise<{
  planName: string;
  tier: PlanTier;
  daysUntilExpiry: number | null;
  requestsThisMonth: number;
  maxRequests: number | null;
}> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  const active = await loadActiveSubscription(userId);
  if (!active) {
    return {
      planName: "Free",
      tier: "free",
      daysUntilExpiry: null,
      requestsThisMonth: 0,
      maxRequests: null,
    };
  }

  // Check if subscription is expired
  const now = new Date();
  if (active.subscription.endDate && active.subscription.endDate <= now) {
    return {
      planName: "Free",
      tier: "free",
      daysUntilExpiry: null,
      requestsThisMonth: 0,
      maxRequests: null,
    };
  }

  // Calculate daysUntilExpiry
  let daysUntilExpiry: number | null = null;
  if (active.subscription.endDate) {
    const daysUntil = Math.ceil(
      (active.subscription.endDate.getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000),
    );
    daysUntilExpiry = Math.max(0, daysUntil);
  }

  // Count requests this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const requestsThisMonth = await prisma.payment.count({
    where: {
      userId,
      createdAt: { gte: monthStart },
      status: "completed",
    },
  });

  return {
    planName: active.plan.name,
    tier: active.plan.tier,
    daysUntilExpiry,
    requestsThisMonth,
    maxRequests:
      active.plan.maxAssistantRequests === 0
        ? null
        : active.plan.maxAssistantRequests,
  };
}

/**
 * Record a payment attempt.
 * Creates a Payment record linked to a subscription.
 * externalPaymentId is optional (filled in Phase 2 when Yookassa responds).
 * Throws if subscription not found or database unavailable.
 */
export async function createPayment(
  userId: string,
  subscriptionId: string,
  amount: number,
  externalPaymentId?: string,
): Promise<Payment> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  // Verify subscription exists
  const subscription = await prisma.userSubscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const { customAlphabet } = await import("nanoid");
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
  return prisma.payment.create({
    data: {
      id: nanoid(),
      userId,
      userSubscriptionId: subscriptionId,
      amount,
      status: "pending",
      externalPaymentId,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update a payment's status after Yookassa webhook or manual adjustment.
 * Throws if payment not found or database unavailable.
 * failureReason is optional, used only if status='failed'.
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  failureReason?: string,
): Promise<Payment> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      failureReason,
    },
  });
}

/**
 * Load payment history for a user.
 * Returns all payments for the user, ordered by creation date (newest first).
 * Throws if database unavailable.
 */
export async function loadPaymentHistory(userId: string): Promise<Payment[]> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
