// Sprint-30-Step-04: User logout endpoint
// POST /api/auth/logout
// Clears the authentication cookie and ends the session.
// Returns 200 OK in all cases (logout is idempotent).

import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
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
