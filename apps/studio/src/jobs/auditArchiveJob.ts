// Sprint-32-Step-06: Audit archive job for managing hot/archive event retention.
// This job runs daily (via cron) to:
// 1. Archive events older than EVENT_HOT_RETENTION_DAYS from Event to EventArchive
// 2. Delete events from EventArchive older than EVENT_ARCHIVE_RETENTION_DAYS

import { archiveOldEvents, deleteArchivedEvents } from "@/repositories";

export const EVENT_HOT_RETENTION_DAYS = parseInt(
  process.env.EVENT_HOT_RETENTION_DAYS || "30",
  10,
);
export const EVENT_ARCHIVE_RETENTION_DAYS = parseInt(
  process.env.EVENT_ARCHIVE_RETENTION_DAYS || "730",
  10,
);

/**
 * Run the full audit archive cycle:
 * 1. Move events older than EVENT_HOT_RETENTION_DAYS from Event to EventArchive
 * 2. Permanently delete events from EventArchive older than EVENT_ARCHIVE_RETENTION_DAYS
 *
 * @returns Object with movedCount and deletedCount
 * @throws Error if the archive cycle fails (database unavailable, etc.)
 */
export async function runAuditArchiveCycle(): Promise<{
  movedCount: number;
  deletedCount: number;
}> {
  console.log("[AuditArchiveJob] Starting audit archive cycle...");

  try {
    // Step 1: Archive old events from hot to archive
    const { movedCount } = await archiveOldEvents(EVENT_HOT_RETENTION_DAYS);
    console.log(
      `[AuditArchiveJob] Moved ${movedCount} events to archive (older than ${EVENT_HOT_RETENTION_DAYS} days).`,
    );

    // Step 2: Delete very old events from archive
    const { deletedCount } = await deleteArchivedEvents(
      EVENT_ARCHIVE_RETENTION_DAYS,
    );
    console.log(
      `[AuditArchiveJob] Deleted ${deletedCount} old archived events (older than ${EVENT_ARCHIVE_RETENTION_DAYS} days).`,
    );

    console.log("[AuditArchiveJob] Archive cycle completed successfully.");
    return { movedCount, deletedCount };
  } catch (error) {
    console.error("[AuditArchiveJob] Error during archive cycle:", error);
    throw error;
  }
}
