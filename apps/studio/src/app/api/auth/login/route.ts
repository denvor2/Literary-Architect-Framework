// Sprint-30-Step-04: User login endpoint
// POST /api/auth/login
// Authenticates user with email and password, returns JWT in httpOnly cookie.
// Returns 200 OK with user data on success, 401 on auth failure, 403 if user is blocked.

import { NextResponse } from "next/server";
import { findUserByEmail, checkPassword } from "@/repositories/userRepository";
import { generateJWT, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    const { email, password } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "email is required and must be a string" },
        { status: 401 },
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { ok: false, error: "password is required and must be a string" },
        { status: 401 },
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { ok: false, error: "Account is blocked" },
        { status: 403 },
      );
    }

    // Verify password
    const passwordValid = await checkPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate JWT token (async with jose for Edge Runtime compatibility)
    const token = await generateJWT(user);

    // Create response with user data
    const response = NextResponse.json(
      {
        ok: true,
        id: user.id,
        email: user.email,
        role: user.role,
      },
      { status: 200 },
    );

    // Set httpOnly cookie with token
    return setAuthCookie(response, token);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Database connection unavailable")) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    console.error("[login] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Login failed" },
      { status: 500 },
    );
  }
}
