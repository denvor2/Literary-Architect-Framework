// Sprint-30-Step-04: JWT authentication utilities (Edge Runtime compatible)
// Uses jose instead of jsonwebtoken (jose supports Edge Runtime)

import { jwtVerify, SignJWT, type JWTPayload as JosePayload } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@/generated/prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRATION_SECONDS = 24 * 60 * 60; // 24 hours as per ADR-0015

// JWT Payload structure (custom, extends jose payload)
export interface AuthPayload extends JosePayload {
  sub: string; // userId
  email: string;
  role: "admin" | "user";
}

// Exported type alias for backwards compatibility
export type JWTPayload = AuthPayload;

/**
 * Get the secret key as a Uint8Array for jose (Edge Runtime compatible)
 */
function getSecretKey(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Generate a JWT token for a user (async - jose requirement for Edge Runtime).
 * Returns a signed token string.
 */
export async function generateJWT(user: User): Promise<string> {
  const payload: AuthPayload = {
    sub: user.id,
    email: user.email,
    role: user.role as "admin" | "user",
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + JWT_EXPIRATION_SECONDS)
    .sign(getSecretKey());
}

/**
 * Verify a JWT token and return the payload (async - jose requirement for Edge Runtime).
 * Returns the decoded payload if valid, null if invalid.
 */
export async function verifyJWT(token: string): Promise<AuthPayload | null> {
  try {
    const verified = await jwtVerify<AuthPayload>(token, getSecretKey());
    return verified.payload;
  } catch {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Extract JWT token from request cookies.
 * Returns the token string if found, null otherwise.
 */
export function extractTokenFromCookie(request: NextRequest): string | null {
  const token = request.cookies.get("auth_token")?.value;
  return token || null;
}

/**
 * Extract JWT token from Authorization header (Bearer <token>).
 * Returns the token string if found and properly formatted, null otherwise.
 */
export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring("Bearer ".length);
}

/**
 * Extract JWT token from request (try cookie first, then header).
 * Returns the token string if found, null otherwise.
 */
export function extractToken(request: NextRequest): string | null {
  return extractTokenFromCookie(request) || extractTokenFromHeader(request);
}

/**
 * Create a response with httpOnly auth_token cookie set.
 * Used in login endpoint to send token securely.
 */
export function setAuthCookie(
  response: NextResponse,
  token: string,
  maxAge = 24 * 60 * 60, // 24 hours in seconds
): NextResponse {
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
    maxAge,
    path: "/",
  });
  return response;
}

/**
 * Create a response with auth_token cookie cleared.
 * Used in logout endpoint.
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
