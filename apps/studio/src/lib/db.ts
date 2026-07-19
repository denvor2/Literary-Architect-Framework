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

function createPrismaClient(): PrismaClient | undefined {
  const connectionString = process.env.DATABASE_URL;
  console.log("[db] Attempting to create Prisma client...");
  console.log("[db] DATABASE_URL:", connectionString ? "✓ set" : "✗ not set");

  if (!connectionString) {
    // DATABASE_URL not configured - log a warning but don't throw.
    // The app will fall back to localStorage. This is expected in
    // development environments without a database configured.
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[db] DATABASE_URL not set. Using localStorage fallback for data persistence.",
      );
    }
    return undefined;
  }
  try {
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter });
    console.log("[db] ✓ Prisma client created successfully");
    return client;
  } catch (error) {
    // Connection failed - log error but don't crash.
    // The app will use localStorage fallback.
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error(`[db] Failed to initialize Prisma client: ${errorMessage}`);
    console.error(`[db] Stack: ${errorStack}`);
    return undefined;
  }
}

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as
  PrismaClient | undefined;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
