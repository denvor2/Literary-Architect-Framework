// Sprint-30-Step-04: Authentication middleware
// Protects API endpoints by verifying JWT token from cookie or Authorization header.
// Allows public routes (/api/auth/*, /api/health, /api/genres) to pass through.

import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyJWT } from "@/lib/auth";

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me", // /me is handled separately - allows checking if user is logged in
  "/api/health",
  "/api/genres",
];

// List of protected routes that require authentication
const PROTECTED_ROUTES = [
  "/api/workspace",
  "/api/series",
  "/api/critic",
  "/api/reader",
  "/api/coauthor",
  "/api/line-editor",
  "/api/book-field",
  "/api/assistant-settings",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is public - allow it through without auth check
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected - require authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (!isProtectedRoute) {
    // Route is neither public nor protected - allow through
    return NextResponse.next();
  }

  // Protected route detected - verify JWT token
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

  // Token is valid - allow request to proceed
  // Note: The actual userId extraction happens in each protected endpoint
  // by calling extractToken() and verifyJWT() again (no request context passing in Next.js middleware)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all /api/* routes except static assets
    "/api/:path*",
  ],
};
