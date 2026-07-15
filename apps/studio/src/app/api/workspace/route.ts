import { NextRequest, NextResponse } from "next/server";
import {
  loadBooksForUser,
  loadDeletedBooksForUser,
  saveBooksForUser,
  softDeleteBook,
  restoreBook,
  permanentlyDeleteBook,
} from "@/repositories";
import { extractToken, verifyJWT } from "@/lib/auth";
import { safeLogEvent } from "@/lib/auditLogger";

async function extractUserId(request: NextRequest): Promise<string | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload || !payload.sub) return null;

  return payload.sub;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("deleted") === "true";

    const userId = await extractUserId(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const books = await loadBooksForUser(userId);

    if (includeDeleted) {
      const deletedBooks = await loadDeletedBooksForUser(userId);
      return NextResponse.json({ ok: true, books, deletedBooks });
    }

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
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const userId = payload.sub;

    // Count chapters and scenes for logging
    let chaptersCount = 0;
    let scenesCount = 0;
    for (const book of books) {
      if (book.chapters && Array.isArray(book.chapters)) {
        chaptersCount += book.chapters.length;
        for (const chapter of book.chapters) {
          if (chapter.scenes && Array.isArray(chapter.scenes)) {
            scenesCount += chapter.scenes.length;
          }
        }
      }
    }

    await saveBooksForUser(userId, books);

    // Log workspace update
    await safeLogEvent(userId, "workspace_updated", {
      booksCount: books.length,
      chaptersCount,
      scenesCount,
    });

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

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("id");
  const action = searchParams.get("action") || "soft-delete";

  if (!bookId) {
    return NextResponse.json(
      { ok: false, error: "Book id is required" },
      { status: 400 },
    );
  }

  try {
    // Get userId from JWT (Sprint-30-Step-04 auth)
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const userId = payload.sub;

    if (action === "restore") {
      await restoreBook(bookId);
      // Logging disabled (EventType not defined in schema)
    } else if (action === "permanent") {
      await permanentlyDeleteBook(bookId);
      // Logging disabled (EventType not defined in schema)
    } else {
      // Default: soft delete
      try {
        // First load the book to get its title for logging
        console.log("[DELETE] Loading books for user:", userId);
        const books = await loadBooksForUser(userId);
        const book = books.find((b) => b.id === bookId);
        const bookTitle = book?.title || "Unknown";
        console.log("[DELETE] Soft-deleting book:", bookId, bookTitle);

        await softDeleteBook(bookId);
        console.log("[DELETE] Book soft-deleted successfully");

        // Log book deleted event
        console.log("[DELETE] Logging event...");
        await safeLogEvent(userId, "book_deleted", { bookId, title: bookTitle });
        console.log("[DELETE] Event logged");
      } catch (err) {
        console.error("[DELETE] Error during soft delete:", err);
        throw err;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE] Catch block:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
