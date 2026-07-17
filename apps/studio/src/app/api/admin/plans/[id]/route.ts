import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const planId = id;

    // Parse request body
    const body = (await request.json()) as {
      name?: unknown;
      price?: unknown;
      maxAssistantRequests?: unknown;
      maxBooks?: unknown;
      maxAssistants?: unknown;
      isActive?: unknown;
      features?: unknown;
      description?: unknown;
    };

    // Build update data (only include fields that are present)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          { ok: false, error: "name must be a string" },
          { status: 400 },
        );
      }
      updateData.name = body.name;
    }

    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) {
        return NextResponse.json(
          { ok: false, error: "price must be a non-negative number" },
          { status: 400 },
        );
      }
      updateData.price = body.price;
    }

    if (body.maxAssistantRequests !== undefined) {
      if (
        typeof body.maxAssistantRequests !== "number" ||
        body.maxAssistantRequests < 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "maxAssistantRequests must be a non-negative number",
          },
          { status: 400 },
        );
      }
      updateData.maxAssistantRequests = body.maxAssistantRequests;
    }

    if (body.maxBooks !== undefined) {
      if (typeof body.maxBooks !== "number" || body.maxBooks < 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "maxBooks must be a non-negative number",
          },
          { status: 400 },
        );
      }
      updateData.maxBooks = body.maxBooks;
    }

    if (body.maxAssistants !== undefined) {
      if (typeof body.maxAssistants !== "number" || body.maxAssistants < 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "maxAssistants must be a non-negative number",
          },
          { status: 400 },
        );
      }
      updateData.maxAssistants = body.maxAssistants;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { ok: false, error: "isActive must be a boolean" },
          { status: 400 },
        );
      }
      updateData.isActive = body.isActive;
    }

    if (body.features !== undefined) {
      if (!Array.isArray(body.features)) {
        return NextResponse.json(
          { ok: false, error: "features must be an array" },
          { status: 400 },
        );
      }
      updateData.features = body.features;
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { ok: false, error: "description must be a string" },
          { status: 400 },
        );
      }
      updateData.description = body.description;
    }

    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Update the plan
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: updateData,
    });

    return NextResponse.json(
      {
        ok: true,
        plan: {
          id: updatedPlan.id,
          name: updatedPlan.name,
          tier: updatedPlan.tier,
          price: updatedPlan.price,
          billingPeriodDays: updatedPlan.billingPeriodDays,
          maxAssistantRequests: updatedPlan.maxAssistantRequests,
          features: updatedPlan.features,
          description: updatedPlan.description,
          isActive: updatedPlan.isActive,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Record to update not found")) {
      return NextResponse.json(
        { ok: false, error: "Plan not found" },
        { status: 404 },
      );
    }

    if (errorMessage.includes("Database connection unavailable")) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    console.error("[admin/plans PUT] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to update plan" },
      { status: 500 },
    );
  }
}
