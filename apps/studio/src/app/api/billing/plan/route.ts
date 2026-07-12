// Sprint-31-Step-04: Get user's current subscription and plan.
// GET /api/billing/plan

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { loadActiveSubscription } from "@/repositories/billingRepository";

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Missing authentication token" },
        { status: 401 },
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Invalid or expired token" },
        { status: 401 },
      );
    }

    // Get user's active subscription
    let active;
    try {
      active = await loadActiveSubscription(payload.sub);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[billing/plan] Subscription load error:", msg);
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    if (!active) {
      return NextResponse.json(
        { ok: false, error: "No active subscription" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        subscription: {
          id: active.subscription.id,
          planId: active.subscription.planId,
          status: active.subscription.status,
          startDate: active.subscription.startDate,
          endDate: active.subscription.endDate,
          externalSubscriptionId: active.subscription.externalSubscriptionId,
        },
        plan: {
          id: active.plan.id,
          name: active.plan.name,
          tier: active.plan.tier,
          price: active.plan.price,
          billingPeriodDays: active.plan.billingPeriodDays,
          maxAssistantRequests: active.plan.maxAssistantRequests,
          features: active.plan.features,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Database connection unavailable")) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    console.error("[billing/plan] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to get subscription" },
      { status: 500 },
    );
  }
}
