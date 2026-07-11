import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  getOrCreateDefaultUser,
  loadSeriesForUser,
  saveSeriesToUser,
  type Series,
} from "@/repositories";

// Sprint-29-Step-04: thin HTTP wrapper over the Sprint-29-Step-03 repository
// layer (ADR-0012 Decision 3 — coarse endpoints mirroring loadSeriesForUser/
// saveSeriesToUser contract). GET/POST/PUT/DELETE operations on /api/series.
//
// No auth/session — single default user (ADR-0012 Decision 1), resolved via
// getOrCreateDefaultUser() on every request. A runtime exception (e.g. database
// is unreachable) is a "DB unavailable" signal for downstream code — there is
// no separate health-check endpoint.

// Validation limits (matching Book field limits for consistency)
const SERIES_TITLE_MAX_LENGTH = 256;
const SERIES_DESCRIPTION_MAX_LENGTH = 1024;

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const series = await loadSeriesForUser(user.id);
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description = "" } = body;

    // Validate title
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { ok: false, error: "title is required and must be a string." },
        { status: 400 },
      );
    }

    if (title.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "title cannot be empty." },
        { status: 400 },
      );
    }

    if (title.length > SERIES_TITLE_MAX_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `title cannot exceed ${SERIES_TITLE_MAX_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    // Validate description
    if (typeof description !== "string") {
      return NextResponse.json(
        { ok: false, error: "description must be a string." },
        { status: 400 },
      );
    }

    if (description.length > SERIES_DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `description cannot exceed ${SERIES_DESCRIPTION_MAX_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();

    // Create new Series with UUID
    const newSeries: Series = {
      id: randomUUID(),
      title: title.trim(),
      description,
      order: 0,
      createdAt: new Date().toISOString(),
    };

    // Load existing series, add new one, save all
    const existingSeries = await loadSeriesForUser(user.id);
    const updatedSeries = [...existingSeries, newSeries];
    await saveSeriesToUser(user.id, updatedSeries);

    return NextResponse.json({ ok: true, series: newSeries }, { status: 201 });
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
  try {
    const body = await request.json();
    const { id, title, description, order } = body;

    // Validate id
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "id is required and must be a string." },
        { status: 400 },
      );
    }

    // Validate title if provided
    if (title !== undefined && title !== null) {
      if (typeof title !== "string") {
        return NextResponse.json(
          { ok: false, error: "title must be a string." },
          { status: 400 },
        );
      }

      if (title.trim().length === 0) {
        return NextResponse.json(
          { ok: false, error: "title cannot be empty." },
          { status: 400 },
        );
      }

      if (title.length > SERIES_TITLE_MAX_LENGTH) {
        return NextResponse.json(
          {
            ok: false,
            error: `title cannot exceed ${SERIES_TITLE_MAX_LENGTH} characters.`,
          },
          { status: 400 },
        );
      }
    }

    // Validate description if provided
    if (description !== undefined && description !== null) {
      if (typeof description !== "string") {
        return NextResponse.json(
          { ok: false, error: "description must be a string." },
          { status: 400 },
        );
      }

      if (description.length > SERIES_DESCRIPTION_MAX_LENGTH) {
        return NextResponse.json(
          {
            ok: false,
            error: `description cannot exceed ${SERIES_DESCRIPTION_MAX_LENGTH} characters.`,
          },
          { status: 400 },
        );
      }
    }

    // Validate order if provided
    if (order !== undefined && order !== null) {
      if (typeof order !== "number" || order < 0) {
        return NextResponse.json(
          { ok: false, error: "order must be a number >= 0." },
          { status: 400 },
        );
      }
    }

    const user = await getOrCreateDefaultUser();
    const existingSeries = await loadSeriesForUser(user.id);

    // Find the series to update
    const seriesIndex = existingSeries.findIndex((s) => s.id === id);
    if (seriesIndex === -1) {
      return NextResponse.json(
        { ok: false, error: "Series not found." },
        { status: 404 },
      );
    }

    // Update the series
    const updatedSeries = {
      ...existingSeries[seriesIndex],
      ...(title !== undefined && title !== null && { title: title.trim() }),
      ...(description !== undefined && description !== null && { description }),
      ...(order !== undefined && order !== null && { order }),
    };

    const newSeriesList = [
      ...existingSeries.slice(0, seriesIndex),
      updatedSeries,
      ...existingSeries.slice(seriesIndex + 1),
    ];

    await saveSeriesToUser(user.id, newSeriesList);

    return NextResponse.json({ ok: true, series: updatedSeries });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    // Validate id
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "id is required and must be a string." },
        { status: 400 },
      );
    }

    const user = await getOrCreateDefaultUser();
    const existingSeries = await loadSeriesForUser(user.id);

    // Check if series exists
    const seriesExists = existingSeries.some((s) => s.id === id);
    if (!seriesExists) {
      return NextResponse.json(
        { ok: false, error: "Series not found." },
        { status: 404 },
      );
    }

    // Filter out the series to delete
    const updatedSeries = existingSeries.filter((s) => s.id !== id);
    await saveSeriesToUser(user.id, updatedSeries);

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
