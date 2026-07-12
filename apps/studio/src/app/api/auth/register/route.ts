// Sprint-30-Step-04: User registration endpoint
// POST /api/auth/register
// Creates a new user with email, password, and CAPTCHA verification.
// Returns 201 Created with user data on success, or 400/409 on validation/conflict errors.

import { NextResponse } from "next/server";
import { createUser } from "@/repositories/userRepository";
import { safeLogEvent } from "@/lib/auditLogger";

// Validation limits
const EMAIL_MAX_LENGTH = 254; // RFC 5321

/**
 * Validate email format (simplified RFC 5321 check).
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= EMAIL_MAX_LENGTH;
}

/**
 * Verify CAPTCHA token with Google reCAPTCHA v3.
 * For Phase 1, this is a placeholder that just checks token is not empty.
 * Future: Integrate with https://www.google.com/recaptcha/api/siteverify
 */
async function verifyCAPTCHA(captchaToken: string): Promise<boolean> {
  // Disable CAPTCHA in development (no CAPTCHA_SECRET_KEY configured)
  if (!process.env.CAPTCHA_SECRET_KEY) {
    return true; // Accept all tokens in dev mode
  }

  if (!captchaToken) {
    return false;
  }

  // Production: Verify with Google reCAPTCHA v3
  if (process.env.CAPTCHA_SECRET_KEY) {
    try {
      const response = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${process.env.CAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        },
      );

      if (!response.ok) {
        console.warn(
          "[register] CAPTCHA verification failed:",
          response.statusText,
        );
        return false;
      }

      const data = (await response.json()) as {
        success: boolean;
        score?: number;
      };
      // Accept score > 0.5 (> 50% human confidence)
      return data.success && (data.score === undefined || data.score > 0.5);
    } catch (error) {
      console.error("[register] CAPTCHA verification error:", error);
      return false;
    }
  }

  // Phase 1: CAPTCHA_SECRET_KEY not configured - accept any non-empty token
  return true;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      captchaToken?: unknown;
    };
    const { email, password, captchaToken } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "email is required and must be a string" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "email must be a valid email address" },
        { status: 400 },
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { ok: false, error: "password is required and must be a string" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          error: "password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    if (!/[a-zA-Z]/.test(password)) {
      return NextResponse.json(
        {
          ok: false,
          error: "password must contain at least one letter",
        },
        { status: 400 },
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        {
          ok: false,
          error: "password must contain at least one digit",
        },
        { status: 400 },
      );
    }

    // Validate CAPTCHA token
    if (!captchaToken || typeof captchaToken !== "string") {
      return NextResponse.json(
        { ok: false, error: "captchaToken is required and must be a string" },
        { status: 400 },
      );
    }

    // Verify CAPTCHA
    const captchaValid = await verifyCAPTCHA(captchaToken);
    if (!captchaValid) {
      return NextResponse.json(
        { ok: false, error: "CAPTCHA verification failed" },
        { status: 400 },
      );
    }

    // Create user
    const user = await createUser(email, password, "user");

    // Log successful registration
    await safeLogEvent(user.id, "register_success", {
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        ok: true,
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle specific errors
    if (errorMessage.includes("already exists")) {
      return NextResponse.json(
        { ok: false, error: "Email already registered" },
        { status: 409 },
      );
    }

    if (errorMessage.includes("Password too weak")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Password does not meet strength requirements",
        },
        { status: 400 },
      );
    }

    if (errorMessage.includes("Database connection unavailable")) {
      return NextResponse.json(
        { ok: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    console.error("[register] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: "Registration failed" },
      { status: 500 },
    );
  }
}
