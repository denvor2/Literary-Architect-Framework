import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDefaultUser } from "@/repositories";
import {
  getSeriesWithStoryBible,
  updateSeriesStoryBible,
} from "@/repositories/seriesRepository";
import type { SeriesStatus } from "@/domain/model";

/**
 * GET /api/series/[id]
 * Retrieve a single series with all Story Bible fields
 * Sprint-34-Step-04: API endpoint for series story bible retrieval
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id: seriesId } = await context.params;

    if (!seriesId) {
      return NextResponse.json(
        { ok: false, error: "Series ID is required" },
        { status: 400 },
      );
    }

    const series = await getSeriesWithStoryBible(seriesId);

    // Verify ownership
    if (series.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, series });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/series/[id]
 * Update a series with Story Bible fields
 * Sprint-34-Step-04: API endpoint for series story bible updates
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id: seriesId } = await context.params;

    if (!seriesId) {
      return NextResponse.json(
        { ok: false, error: "Series ID is required" },
        { status: 400 },
      );
    }

    // First, verify that the series exists and belongs to the user
    const existingSeries = await getSeriesWithStoryBible(seriesId);
    if (existingSeries.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 },
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
    const validSeriesStatuses: SeriesStatus[] = [
      "outline",
      "in_progress",
      "complete",
      "published",
    ];
    const validAudiences = ["Adult", "YA", "Teen"];

    // Validate status enum field
    const statusStr = body.status as string | undefined;
    const validatedStatus: SeriesStatus | undefined = statusStr
      ? validSeriesStatuses.includes(statusStr as SeriesStatus)
        ? (statusStr as SeriesStatus)
        : undefined
      : undefined;

    if (statusStr && !validatedStatus) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status. Must be one of: ${validSeriesStatuses.join(", ")}`,
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

    // Validate estimatedTotalWordCount
    const estimatedTotalWordCount = body.estimatedTotalWordCount as
      number | undefined;
    if (estimatedTotalWordCount && estimatedTotalWordCount <= 0) {
      return NextResponse.json(
        { ok: false, error: "estimatedTotalWordCount must be greater than 0" },
        { status: 400 },
      );
    }

    // Build updateData object
    const updateData = {
      targetAudience: targetAudienceStr,
      genre: genreArr,
      estimatedTotalWordCount,
      status: validatedStatus,
      decisions: body.decisions as string | undefined,
      throughlineElements: body.throughlineElements as string[] | undefined,
      seriesConstraints: body.seriesConstraints as string[] | undefined,
      notes: body.notes as string | undefined,
      firstPublishedDate:
        typeof body.firstPublishedDate === "string"
          ? new Date(body.firstPublishedDate)
          : undefined,
      author: body.author as string | undefined,
    };

    // Update the series
    const updatedSeries = await updateSeriesStoryBible(seriesId, updateData);

    return NextResponse.json(
      { ok: true, series: updatedSeries },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
