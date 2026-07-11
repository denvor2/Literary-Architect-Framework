// Sprint-29-Step-03: series repository — reads/writes the whole `Series[]` tree
// for a user against Prisma, per ADR-0012 Decision 3 (coarse contract, same
// semantics for series as for books).

import { prisma } from "@/lib/db";

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
          },
          update: {
            title: s.title,
            description: s.description,
            order: s.order,
          },
        });
      }
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
}
