// Sprint-31-Step-04: Update payment status (webhook from Stripe).
// PUT /api/billing/payment/[id]

import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatus } from "@/repositories/billingRepository";
import { prisma } from "@/lib/db";
import { safeLogEvent } from "@/lib/auditLogger";

// Main handler wrapped in defensive error boundary
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Outermost try/catch to catch ANY error that escapes
  try {
    return await handlePutRequest(request, context);
  } catch (error) {
    // Fallback error handler - this should never be reached if inner handlers are correct
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[billing/payment/[id]] Uncaught error:",
      errorMessage,
      error,
    );
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Actual handler logic separated for clearer error handling
async function handlePutRequest(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // Extract payment ID from params
  let paymentId: string;
  try {
    const resolvedParams = await params;
    if (!resolvedParams || typeof resolvedParams.id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid request: missing or invalid payment ID" },
        { status: 400 },
      );
    }
    paymentId = resolvedParams.id;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[billing/payment/[id]] Params resolution error:", msg);
    return NextResponse.json(
      { ok: false, error: "Invalid payment ID parameter" },
      { status: 400 },
    );
  }

  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn("[billing/payment/[id]] JSON parse error:", msg);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const status = body.status;
  const failureReason = body.failureReason;
  const externalPaymentId = body.externalPaymentId;

  // Validate status is one of the allowed values
  if (
    !status ||
    typeof status !== "string" ||
    !["pending", "completed", "failed"].includes(status)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "status is required and must be one of: pending, completed, failed",
      },
      { status: 400 },
    );
  }

  // Validate failureReason if provided
  if (failureReason !== undefined && typeof failureReason !== "string") {
    return NextResponse.json(
      { ok: false, error: "failureReason must be a string" },
      { status: 400 },
    );
  }

  // Validate externalPaymentId if provided
  if (
    externalPaymentId !== undefined &&
    typeof externalPaymentId !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "externalPaymentId must be a string" },
      { status: 400 },
    );
  }

  // Check if Prisma is available
  if (!prisma) {
    return NextResponse.json(
      { ok: false, error: "Service temporarily unavailable" },
      { status: 503 },
    );
  }

  try {
    // Verify payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Payment not found" },
        { status: 400 },
      );
    }

    // Update payment status
    const updated = await updatePaymentStatus(
      paymentId,
      status as "pending" | "completed" | "failed",
      failureReason as string | undefined,
    );

    // If externalPaymentId provided, update it via Prisma
    if (externalPaymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          externalPaymentId: externalPaymentId as string,
        },
      });
    }

    // Log payment status update
    if (updated.status === "completed") {
      await safeLogEvent(payment.userId, "payment_completed", {
        paymentId: updated.id,
        amount: updated.amount,
      });
    } else if (updated.status === "failed") {
      await safeLogEvent(payment.userId, "payment_failed", {
        paymentId: updated.id,
        failureReason: updated.failureReason,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        payment: {
          id: updated.id,
          status: updated.status,
          amount: updated.amount,
          externalPaymentId: updated.externalPaymentId,
          failureReason: updated.failureReason,
          createdAt: updated.createdAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle database-related errors
    if (
      errorMessage.includes("Database connection unavailable") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ETIMEDOUT")
    ) {
      console.error("[billing/payment/[id]] Database error:", errorMessage);
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    console.error("[billing/payment/[id]] Unexpected error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to update payment" },
      { status: 500 },
    );
  }
}
