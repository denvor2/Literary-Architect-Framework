// Sprint-32-Step-05: Get current user's audit events
// GET /api/audit/events/me
// Returns audit events for the authenticated user within a date range
// Query params: startDate (required), endDate (required), eventType (optional)

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { getUserEventLog } from "@/repositories/auditRepository";
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

    // Apply rate limiting per user
    const rateLimit = await applyRateLimit(
      payload.sub,
      "GET /api/audit/events/me",
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
    const eventType = searchParams.get("eventType");

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

    // Query events
    const events = await getUserEventLog(
      payload.sub,
      startDate,
      endDate,
      eventType ? [eventType] : undefined,
    );

    const response = NextResponse.json(
      {
        success: true,
        data: events,
        totalCount: events.length,
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

    console.error("[audit/events/me] Error:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
