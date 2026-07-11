import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Sprint-27-Step-02: Health check endpoint for Kubernetes, Docker Compose,
// and cloud load balancers. Checks both application readiness and database
// connectivity without requiring authentication.
//
// Returns JSON with health status:
// - ok: true if database is connected, false otherwise
// - database: "connected" or "disconnected"
// - error: (optional) error message if database check failed
// - timestamp: ISO8601 timestamp of the check

const HEALTH_CHECK_TIMEOUT_MS = 5000; // 5 second timeout for DB check

export async function POST() {
  const timestamp = new Date().toISOString();

  // If Prisma client is not initialized (DATABASE_URL not set or connection
  // failed during initialization), report database as disconnected
  if (!prisma) {
    return NextResponse.json({
      ok: false,
      database: "disconnected",
      error: "Prisma client not initialized",
      timestamp,
    });
  }

  try {
    // Use Promise.race to enforce timeout on database query
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database health check timeout")),
          HEALTH_CHECK_TIMEOUT_MS,
        ),
      ),
    ]);

    return NextResponse.json({
      ok: true,
      database: "connected",
      timestamp,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn(`[health] Database check failed: ${errorMessage}`);

    return NextResponse.json({
      ok: false,
      database: "disconnected",
      error: errorMessage,
      timestamp,
    });
  }
}
