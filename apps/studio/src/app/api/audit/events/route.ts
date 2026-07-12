// Sprint-32-Step-05: Get all audit events (admin only)
// GET /api/audit/events
// Returns all audit events system-wide with pagination and filtering
// Admin only. Query params: startDate (required), endDate (required),
// userId (optional), eventType (optional), limit (optional, default 100, max 1000),
// offset (optional, default 0)

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import type { EventType } from "@/generated/prisma/client";

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
      "GET /api/audit/events",
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
            "X-RateLimit-Limit": "60",
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
    const eventType = searchParams.get("eventType");
    const limitStr = searchParams.get("limit") || "100";
    const offsetStr = searchParams.get("offset") || "0";

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

    // Validate and parse limit
    const limit = Math.min(Math.max(1, parseInt(limitStr, 10)), 1000);
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "limit must be a number between 1 and 1000",
        },
        { status: 400 },
      );
    }

    // Validate and parse offset
    const offset = Math.max(0, parseInt(offsetStr, 10));
    if (isNaN(offset)) {
      return NextResponse.json(
        {
          success: false,
          error: "offset must be a non-negative number",
        },
        { status: 400 },
      );
    }

    // Check database connection
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Database connection unavailable" },
        { status: 500 },
      );
    }

    // Build query filters
    const where: {
      createdAt: { gte: Date; lte: Date };
      userId?: string;
      eventType?: { in: EventType[] };
    } = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    if (eventType) {
      where.eventType = {
        in: [eventType as EventType],
      };
    }

    // Query events with pagination
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.event.count({ where }),
    ]);

    const response = NextResponse.json(
      {
        success: true,
        data: events,
        totalCount,
        limit,
        offset,
      },
      { status: 200 },
    );

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "60");
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

    console.error("[audit/events] Error:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
