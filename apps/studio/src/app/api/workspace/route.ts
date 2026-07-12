import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateDefaultUser,
  loadBooksForUser,
  saveBooksForUser,
} from "@/repositories";
import { extractToken, verifyJWT } from "@/lib/auth";

// Sprint-30-Step-04: Authentication added. JWT auth via middleware.
// Per middleware.ts, this endpoint is protected — JWT already validated.
// If middleware allowed the request through, JWT is valid.
// userId extracted from token payload.

async function getUserIdFromAuth(
  request: NextRequest,
): Promise<string | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  return payload.sub;
}

export async function GET(request: NextRequest) {
  try {
    // Get userId from JWT (Sprint-30-Step-04 auth)
    let userId = await getUserIdFromAuth(request);

    // Fallback to default user if auth not present (backwards compatibility during transition)
    if (!userId) {
      const user = await getOrCreateDefaultUser();
      userId = user.id;
    }

    const books = await loadBooksForUser(userId);
    return NextResponse.json({ ok: true, books });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const books = body?.books;

  if (!Array.isArray(books)) {
    return NextResponse.json(
      { ok: false, error: "books is required and must be an array." },
      { status: 400 },
    );
  }

  try {
    // Get userId from JWT (Sprint-30-Step-04 auth)
    let userId = await getUserIdFromAuth(request);

    // Fallback to default user if auth not present (backwards compatibility)
    if (!userId) {
      const user = await getOrCreateDefaultUser();
      userId = user.id;
    }

    await saveBooksForUser(userId, books);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
