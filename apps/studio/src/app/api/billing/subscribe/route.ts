// Sprint-31-Step-04: Initiate a new subscription with Stripe payment intent.
// POST /api/billing/subscribe

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { loadPlan, createSubscription } from "@/repositories/billingRepository";
import { safeLogEvent } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const planId = body.planId;

    // Validate planId
    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { ok: false, error: "planId is required and must be a string" },
        { status: 400 },
      );
    }

    // Verify plan exists and is active
    let plan;
    try {
      plan = await loadPlan(planId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[billing/subscribe] Plan load error:", msg);
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    if (!plan) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 },
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 },
      );
    }

    // Create subscription
    let subscription;
    try {
      subscription = await createSubscription(payload.sub, planId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[billing/subscribe] Subscription creation error:", msg);
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Log subscription creation
    await safeLogEvent(payload.sub, "subscription_created", {
      subscriptionId: subscription.id,
      planId: subscription.planId,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate?.toISOString() || null,
    });

    // Generate mock Stripe Payment Intent (Phase 1 placeholder)
    const mockClientSecret = `pi_mock_${subscription.id}_${Date.now()}`;

    return NextResponse.json(
      {
        ok: true,
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
        stripePaymentIntent: {
          clientSecret: mockClientSecret,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[billing/subscribe] Unexpected error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to initiate subscription" },
      { status: 500 },
    );
  }
}
