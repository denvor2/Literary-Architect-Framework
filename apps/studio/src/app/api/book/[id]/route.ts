import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDefaultUser, loadBooksForUser } from "@/repositories";
import {
  getBookWithStoryBible,
  updateBookStoryBible,
  getBookWithSeriesContext,
} from "@/repositories/bookRepository";
import type { BookStatus } from "@/domain/model";

/**
 * GET /api/book/[id]
 * Retrieve a single book with all Story Bible fields
 * Includes inherited fields from series if applicable
 * Sprint-34-Step-04: API endpoint for book story bible retrieval
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id: bookId } = await context.params;

    if (!bookId) {
      return NextResponse.json(
        { ok: false, error: "Book ID is required" },
        { status: 400 },
      );
    }

    // Load books for user to verify ownership
    const userBooks = await loadBooksForUser(user.id);
    const bookExists = userBooks.some((b) => b.id === bookId);

    if (!bookExists) {
      return NextResponse.json(
        { ok: false, error: "Book not found or unauthorized" },
        { status: 404 },
      );
    }

    // Check if requesting inherited fields
    const url = new URL(request.url);
    const includeInherited = url.searchParams.get("inherited") === "true";

    if (includeInherited) {
      const result = await getBookWithSeriesContext(bookId);
      return NextResponse.json({ ok: true, ...result });
    } else {
      const book = await getBookWithStoryBible(bookId);
      return NextResponse.json({ ok: true, book });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { ok: false, error: "Book not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/book/[id]
 * Update a book with Story Bible fields
 * Sprint-34-Step-04: API endpoint for book story bible updates
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id: bookId } = await context.params;

    if (!bookId) {
      return NextResponse.json(
        { ok: false, error: "Book ID is required" },
        { status: 400 },
      );
    }

    // Load books for user to verify ownership
    const userBooks = await loadBooksForUser(user.id);
    const bookExists = userBooks.some((b) => b.id === bookId);

    if (!bookExists) {
      return NextResponse.json(
        { ok: false, error: "Book not found or unauthorized" },
        { status: 404 },
      );
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate and extract Story Bible fields
    const validBookStatuses: BookStatus[] = [
      "outline",
      "draft",
      "editing",
      "beta",
      "published",
    ];
    const validAudiences = ["Adult", "YA", "Teen"];

    // Validate enum fields
    const statusStr = body.status as string | undefined;
    const validatedStatus: BookStatus | undefined = statusStr
      ? validBookStatuses.includes(statusStr as BookStatus)
        ? (statusStr as BookStatus)
        : undefined
      : undefined;

    if (statusStr && !validatedStatus) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status. Must be one of: ${validBookStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate targetAudience
    const targetAudienceStr = body.targetAudience as string | undefined;
    if (targetAudienceStr && !validAudiences.includes(targetAudienceStr)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid targetAudience. Must be one of: ${validAudiences.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate genre array
    const genreArr = body.genre as string[] | undefined;
    if (genreArr && (!Array.isArray(genreArr) || genreArr.length === 0)) {
      return NextResponse.json(
        {
          ok: false,
          error: "genre must be a non-empty array of strings",
        },
        { status: 400 },
      );
    }

    // Validate estimatedWordCount
    const estimatedWordCount = body.estimatedWordCount as number | undefined;
    if (estimatedWordCount && estimatedWordCount <= 0) {
      return NextResponse.json(
        { ok: false, error: "estimatedWordCount must be greater than 0" },
        { status: 400 },
      );
    }

    // Validate estimatedChapters
    const estimatedChapters = body.estimatedChapters as number | undefined;
    if (estimatedChapters && estimatedChapters <= 0) {
      return NextResponse.json(
        { ok: false, error: "estimatedChapters must be greater than 0" },
        { status: 400 },
      );
    }

    // Validate mainPlotlines array
    const mainPlotlines = body.mainPlotlines as string[] | undefined;
    if (mainPlotlines && !Array.isArray(mainPlotlines)) {
      return NextResponse.json(
        {
          ok: false,
          error: "mainPlotlines must be an array of strings",
        },
        { status: 400 },
      );
    }

    // Validate themes array
    const themes = body.themes as string[] | undefined;
    if (themes && !Array.isArray(themes)) {
      return NextResponse.json(
        {
          ok: false,
          error: "themes must be an array of strings",
        },
        { status: 400 },
      );
    }

    // Validate bookConstraints array
    const bookConstraints = body.bookConstraints as string[] | undefined;
    if (bookConstraints && !Array.isArray(bookConstraints)) {
      return NextResponse.json(
        {
          ok: false,
          error: "bookConstraints must be an array of strings",
        },
        { status: 400 },
      );
    }

    // Build updateData object
    const updateData = {
      workingTitle: body.workingTitle as string | undefined,
      targetAudience: targetAudienceStr,
      genre: genreArr,
      estimatedWordCount,
      estimatedChapters,
      status: validatedStatus,
      mainPlotlines,
      principle: body.principle as string | undefined,
      escalation: body.escalation as string | undefined,
      themes,
      bookConstraints,
      notes: body.notes as string | undefined,
      publishedDate:
        typeof body.publishedDate === "string"
          ? new Date(body.publishedDate)
          : undefined,
      isbn: body.isbn as string | undefined,
    };

    // Update the book
    const updatedBook = await updateBookStoryBible(bookId, updateData);

    return NextResponse.json({ ok: true, book: updatedBook }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { ok: false, error: "Book not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
