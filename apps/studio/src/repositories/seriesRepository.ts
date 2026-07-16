// Sprint-29-Step-03: series repository — reads/writes the whole `Series[]` tree
// for a user against Prisma, per ADR-0012 Decision 3 (coarse contract, same
// semantics for series as for books).
// Sprint-34-Step-03: Extended with Story Bible functions for series planning.

import { prisma } from "@/lib/db";
import type { Series as DomainSeries, SeriesStatus } from "@/domain/model";

// Domain-like Series type (not yet in domain/model.ts — that's Step-03б).
// Mirrors Prisma model but with createdAt as ISO string (not Date object).
export type Series = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly createdAt: string;
};

type PrismaSeries = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: Date;
};

function toDomainSeries(prismaSeries: PrismaSeries): Series {
  return {
    id: prismaSeries.id,
    title: prismaSeries.title,
    description: prismaSeries.description ?? "",
    order: prismaSeries.order,
    createdAt: prismaSeries.createdAt.toISOString(),
  };
}

export async function loadSeriesForUser(userId: string): Promise<Series[]> {
  if (!prisma) {
    throw new Error("Database connection unavailable. Cannot load series.");
  }
  const series = await prisma.series.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return series.map(toDomainSeries);
}

export async function saveSeriesToUser(
  userId: string,
  series: readonly Series[],
): Promise<void> {
  if (!prisma) {
    throw new Error("Database connection unavailable. Cannot save series.");
  }
  await prisma.$transaction(
    async (tx) => {
      const incomingSeriesIds = series.map((s) => s.id);

      // Coarse contract (ADR-0012 Decision 3): the passed-in `series[]` is
      // the full, authoritative state for this user — anything not present
      // gets deleted.
      await tx.series.deleteMany({
        where: { userId, id: { notIn: incomingSeriesIds } },
      });

      for (const s of series) {
        await tx.series.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            userId,
            title: s.title,
            description: s.description,
            order: s.order,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(),
          },
          update: {
            title: s.title,
            description: s.description,
            order: s.order,
            updatedAt: new Date(),
          },
        });
      }
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
}

// Sprint-34-Step-03: Story Bible functions for Series

type SeriesStoryBibleInput = {
  targetAudience?: string;
  genre?: string[];
  estimatedTotalWordCount?: number;
  status?: SeriesStatus;
  decisions?: string;
  throughlineElements?: string[];
  seriesConstraints?: string[];
  notes?: string;
  firstPublishedDate?: Date;
  author?: string;
};

/**
 * Update Series Story Bible fields
 * Sprint-34-Step-03: Persist Story Bible metadata for series-level planning
 */
export async function updateSeriesStoryBible(
  seriesId: string,
  data: SeriesStoryBibleInput,
): Promise<DomainSeries> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot update series story bible.",
    );
  }

  const updated = await prisma.series.update({
    where: { id: seriesId },
    data: {
      targetAudience: data.targetAudience ?? undefined,
      genre: data.genre ?? undefined,
      estimatedTotalWordCount: data.estimatedTotalWordCount,
      status: data.status,
      decisions: data.decisions,
      throughlineElements: data.throughlineElements ?? undefined,
      seriesConstraints: data.seriesConstraints ?? undefined,
      notes: data.notes,
      firstPublishedDate: data.firstPublishedDate,
      author: data.author,
      updatedAt: new Date(),
    },
  });

  return toDomainSeriesWithStoryBible(updated);
}

/**
 * Get Series with all Story Bible fields
 * Sprint-34-Step-03: Retrieve complete series metadata for planning and display
 */
export async function getSeriesWithStoryBible(
  seriesId: string,
): Promise<DomainSeries> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot get series story bible.",
    );
  }

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
  });

  if (!series) {
    throw new Error(`Series not found: ${seriesId}`);
  }

  return toDomainSeriesWithStoryBible(series);
}

/**
 * List all Series with Story Bible data for a user
 * Sprint-34-Step-03: Retrieve all series with their planning metadata
 */
export async function listSeriesWithStoryBible(
  userId: string,
): Promise<DomainSeries[]> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot list series story bibles.",
    );
  }

  const series = await prisma.series.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });

  return series.map(toDomainSeriesWithStoryBible);
}

// Helper: Convert Prisma series to domain series with all Story Bible fields
function toDomainSeriesWithStoryBible(prismaSeries: any): DomainSeries {
  return {
    id: prismaSeries.id,
    userId: prismaSeries.userId,
    title: prismaSeries.title,
    description: prismaSeries.description ?? "",
    order: prismaSeries.order,
    createdAt: prismaSeries.createdAt.toISOString(),
    updatedAt: prismaSeries.updatedAt.toISOString(),
    targetAudience: prismaSeries.targetAudience ?? undefined,
    genre: prismaSeries.genre ? (prismaSeries.genre as string[]) : undefined,
    estimatedTotalWordCount: prismaSeries.estimatedTotalWordCount ?? undefined,
    status: prismaSeries.status ?? undefined,
    decisions: prismaSeries.decisions ?? undefined,
    throughlineElements: prismaSeries.throughlineElements
      ? (prismaSeries.throughlineElements as string[])
      : undefined,
    seriesConstraints: prismaSeries.seriesConstraints
      ? (prismaSeries.seriesConstraints as string[])
      : undefined,
    notes: prismaSeries.notes ?? undefined,
    firstPublishedDate: prismaSeries.firstPublishedDate ?? undefined,
    author: prismaSeries.author ?? undefined,
  };
}
