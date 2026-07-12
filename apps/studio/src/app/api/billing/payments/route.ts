// Sprint-31-Step-04: Get payment history for the current user.
// GET /api/billing/payments

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Load payments with subscription and plan details
    let payments;
    try {
      payments = await prisma.payment.findMany({
        where: { userId: payload.sub },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("[billing/payments] Database query error:", msg);
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const response = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      externalPaymentId: payment.externalPaymentId,
      paymentMethod: payment.paymentMethod,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      subscription: {
        planId: payment.subscription.planId,
        plan: {
          name: payment.subscription.plan.name,
        },
      },
    }));

    return NextResponse.json(
      {
        ok: true,
        payments: response,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[billing/payments] Unexpected error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to load payments" },
      { status: 500 },
    );
  }
}
