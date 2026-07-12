// Sprint-32-Step-06: Cron job endpoint for archive automation
// POST /api/cron/archive-events
// Triggered by external cron service (Vercel Cron, cron-job.org, etc.)
// No authentication required (called by scheduler, not user)
// Runs the full audit archive cycle: archive old events + delete very old archived events

import { NextResponse } from "next/server";
import { runAuditArchiveCycle } from "@/jobs/auditArchiveJob";

/**
 * Handle POST requests to trigger the audit archive cycle.
 * Called by external cron service (Vercel Cron, cron-job.org, etc.)
 * No auth required (called by scheduler, not user)
 *
 * @returns JSON response with success status and result counts
 */
export async function POST() {
  try {
    console.log("[Archive Endpoint] Received cron trigger request");

    const result = await runAuditArchiveCycle();

    console.log(
      `[Archive Endpoint] Archive cycle completed: moved=${result.movedCount}, deleted=${result.deletedCount}`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Archive cycle completed",
        movedCount: result.movedCount,
        deletedCount: result.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[Archive Endpoint] Error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Archive cycle failed",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
