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

    // Get full user data from database
    const user = await getUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 401 },
      );
    }

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
