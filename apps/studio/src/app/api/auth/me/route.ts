// Sprint-30-Step-04: Current user info endpoint
// GET /api/auth/me
// Returns information about the currently logged-in user.
// Requires valid JWT token in cookie or Authorization header.
// Returns 200 OK with user data, or 401 if not authenticated.

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";
import { getUserById } from "@/repositories/userRepository";

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token from cookies or Authorization header
    const token = extractToken(request);

    if (!token) {
      // Debug: log missing token (common on first load before login)
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Missing authentication token" },
        { status: 401 },
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      // Token is invalid or expired
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Invalid or expired token" },
        { status: 401 },
      );
    }

    // Get full user data from database to include isBlocked status
    const user = await getUserById(payload.sub);
    if (!user) {
      // User was deleted or doesn't exist
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 401 },
      );
    }

    // Check if user is blocked - deny access if blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { ok: false, error: "Account is blocked" },
        { status: 403 },
      );
    }

    // User is authenticated and not blocked - return user data
    return NextResponse.json(
      {
        ok: true,
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
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

    console.error("[me] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Failed to get user info" },
      { status: 500 },
    );
  }
}
