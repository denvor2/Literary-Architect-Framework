// Sprint-31-Step-04: Billing endpoints — list plans and create plans (admin).
// GET /api/billing — list all active plans (public)
// POST /api/billing — create new plan (admin only)

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { loadActivePlans } from "@/repositories/billingRepository";
import { prisma } from "@/lib/db";

async function getUserFromAuth(
  request: NextRequest,
): Promise<{ sub: string; role: string } | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  return {
    sub: payload.sub,
    role: payload.role || "user",
  };
}

export async function GET() {
  try {
    // Call repository to load plans
    let plans;
    try {
      plans = await loadActivePlans();
    } catch (repoError) {
      const errorMsg =
        repoError instanceof Error ? repoError.message : String(repoError);
      console.error("[billing GET] Repository error:", errorMsg);

      // All repository errors indicate database issues
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Sort plans by tier order: free → basic → pro → premium
    const tierOrder = { free: 0, basic: 1, pro: 2, premium: 3 };
    const sortedPlans = plans.sort(
      (a, b) =>
        (tierOrder[a.tier as keyof typeof tierOrder] ?? 99) -
        (tierOrder[b.tier as keyof typeof tierOrder] ?? 99),
    );

    // Format response
    const response = sortedPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      price: plan.price,
      billingPeriodDays: plan.billingPeriodDays,
      maxBooks: plan.maxBooks,
      maxAssistants: plan.maxAssistants,
      maxAssistantRequests: plan.maxAssistantRequests,
      features: plan.features,
      description: plan.description,
      isActive: plan.isActive,
    }));

    return NextResponse.json(
      {
        ok: true,
        plans: response,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[billing GET] Unexpected error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to load plans" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user and verify admin role
    const auth = await getUserFromAuth(request);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Missing authentication token" },
        { status: 401 },
      );
    }

    if (auth.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = (await request.json()) as {
      name?: unknown;
      tier?: unknown;
      price?: unknown;
      billingPeriodDays?: unknown;
      maxAssistantRequests?: unknown;
      features?: unknown;
      description?: unknown;
    };

    const {
      name,
      tier,
      price,
      billingPeriodDays,
      maxAssistantRequests,
      features,
      description,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { ok: false, error: "name is required and must be a string" },
        { status: 400 },
      );
    }

    if (
      !tier ||
      !["free", "basic", "pro", "premium"].includes(tier as string)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "tier is required and must be one of: free, basic, pro, premium",
        },
        { status: 400 },
      );
    }

    if (price === undefined || typeof price !== "number" || price < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "price is required and must be a non-negative number",
        },
        { status: 400 },
      );
    }

    if (
      billingPeriodDays === undefined ||
      typeof billingPeriodDays !== "number" ||
      billingPeriodDays <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "billingPeriodDays is required and must be a positive number",
        },
        { status: 400 },
      );
    }

    if (
      maxAssistantRequests === undefined ||
      typeof maxAssistantRequests !== "number" ||
      maxAssistantRequests < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "maxAssistantRequests is required and must be a non-negative number",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(features)) {
      return NextResponse.json(
        { ok: false, error: "features is required and must be an array" },
        { status: 400 },
      );
    }

    if (description !== undefined && typeof description !== "string") {
      return NextResponse.json(
        { ok: false, error: "description must be a string" },
        { status: 400 },
      );
    }

    // Check if plan with this tier already exists
    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const existingPlan = await prisma.plan.findUnique({
      where: { tier: tier as string },
    });

    if (existingPlan) {
      return NextResponse.json(
        { ok: false, error: `Plan with tier '${tier}' already exists` },
        { status: 400 },
      );
    }

    // Create the plan
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
    const newPlan = await prisma.plan.create({
      data: {
        id: nanoid(),
        name,
        tier: tier as string,
        price,
        billingPeriodDays,
        maxAssistantRequests,
        features: features as string[],
        description,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        plan: {
          id: newPlan.id,
          name: newPlan.name,
          tier: newPlan.tier,
          price: newPlan.price,
          billingPeriodDays: newPlan.billingPeriodDays,
          maxAssistantRequests: newPlan.maxAssistantRequests,
          features: newPlan.features,
          description: newPlan.description,
        },
      },
      { status: 201 },
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

    console.error("[billing POST] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to create plan" },
      { status: 500 },
    );
  }
}
