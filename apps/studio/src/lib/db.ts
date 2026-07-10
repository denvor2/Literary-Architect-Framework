// Sprint-23-Step-04: Prisma client singleton.
// In development, Next.js hot-reloads create new module instances on every
// change. Without this singleton pattern, each reload would open a new DB
// connection, eventually exhausting PostgreSQL's connection limit. In
// production, the module is only loaded once, so the global caching is
// harmless.
//
// Prisma 7.x with `prisma-client` generator requires a driver adapter.
// We use `@prisma/adapter-pg` for PostgreSQL.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env.local or docker-compose environment.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
