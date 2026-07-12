// Sprint-30-Step-04: User logout endpoint
// POST /api/auth/logout
// Clears the authentication cookie and ends the session.
// Returns 200 OK in all cases (logout is idempotent).

import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, extractToken, verifyJWT } from "@/lib/auth";
import { safeLogEvent } from "@/lib/auditLogger";

export async function POST(request: NextRequest) {
  try {
    // Extract user ID from JWT for logging
    const token = extractToken(request);
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        userId = payload.sub;
        userEmail = payload.email;
      }
    }

    // Log logout event
    if (userId) {
      await safeLogEvent(userId, "logout", { email: userEmail });
    }

    // Create response
    const response = NextResponse.json(
      { ok: true, message: "Logged out successfully" },
      { status: 200 },
    );

    // Clear auth cookie
    return clearAuthCookie(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[logout] Error:", errorMessage);

    // Even on error, try to clear the cookie
    const response = NextResponse.json(
      { ok: false, error: "Logout failed" },
      { status: 500 },
    );
    return clearAuthCookie(response);
  }
}
