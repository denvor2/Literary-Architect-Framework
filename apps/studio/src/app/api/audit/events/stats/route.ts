// Sprint-32-Step-05: Get audit event statistics (admin only)
// GET /api/audit/events/stats
// Returns count of events grouped by event type within a date range
// Admin only. Query params: startDate (required), endDate (required), userId (optional)

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { getEventStats } from "@/repositories/auditRepository";
import { applyRateLimit } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check admin role
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Apply rate limiting per admin
    const rateLimit = await applyRateLimit(
      payload.sub,
      "GET /api/audit/events/stats",
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.max(
            1,
            rateLimit.resetTime - Math.floor(Date.now() / 1000),
          ),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetTime),
            "Retry-After": String(
              Math.max(1, rateLimit.resetTime - Math.floor(Date.now() / 1000)),
            ),
          },
        },
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    // Validate startDate
    if (!startDateStr) {
      return NextResponse.json(
        { success: false, error: "startDate is required" },
        { status: 400 },
      );
    }

    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate must be a valid ISO 8601 date",
        },
        { status: 400 },
      );
    }

    // Validate endDate
    if (!endDateStr) {
      return NextResponse.json(
        { success: false, error: "endDate is required" },
        { status: 400 },
      );
    }

    const endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "endDate must be a valid ISO 8601 date",
        },
        { status: 400 },
      );
    }

    // Validate date range
    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate must be before endDate",
        },
        { status: 400 },
      );
    }

    // Query stats
    const stats = await getEventStats(startDate, endDate, userId || undefined);

    const response = NextResponse.json(
      {
        success: true,
        data: stats,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      { status: 200 },
    );

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "30");
    response.headers.set(
      "X-RateLimit-Remaining",
      String(Math.max(0, rateLimit.remaining)),
    );
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetTime));

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Database connection unavailable")) {
      return NextResponse.json(
        { success: false, error: "Database connection unavailable" },
        { status: 500 },
      );
    }

    console.error("[audit/events/stats] Error:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
