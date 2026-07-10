import { NextResponse } from "next/server";
import {
  getOrCreateDefaultUser,
  loadBooksForUser,
  saveBooksForUser,
} from "@/repositories";

// Sprint-24-Step-04: thin HTTP wrapper over the Sprint-24-Step-03 repository
// layer (ADR-0012 Decision 3 — one coarse endpoint mirroring today's
// loadWorkspace()/saveWorkspace() contract, not granular REST per entity).
//
// No auth/session — single default user (ADR-0012 Decision 1), resolved via
// getOrCreateDefaultUser() on every request. A runtime exception (e.g. the
// database is unreachable) is the dual-mode "DB unavailable" signal for
// Sprint-24-Step-05 — there is no separate health-check endpoint.

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const books = await loadBooksForUser(user.id);
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

export async function PUT(request: Request) {
  const body = await request.json();
  const books = body?.books;

  if (!Array.isArray(books)) {
    return NextResponse.json(
      { ok: false, error: "books is required and must be an array." },
      { status: 400 },
    );
  }

  try {
    const user = await getOrCreateDefaultUser();
    await saveBooksForUser(user.id, books);
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
