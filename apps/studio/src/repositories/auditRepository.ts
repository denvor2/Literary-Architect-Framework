// Sprint-32-Step-03: Repository layer for audit event logging, querying, and
// archiving. Provides functions to record user actions (login, book creation, etc.),
// query event history by user or system-wide, and manage hot/archive event tables.

import { prisma } from "@/lib/db";
import type { Event, EventType, Prisma } from "@/generated/prisma/client";

/**
 * Write a single event to the Event table.
 * @param userId - User ID (must exist in User table, or throws "User not found")
 * @param eventType - Event type (e.g., 'login_success', 'book_created')
 * @param metadata - Optional JSON metadata with event context
 * @returns The created Event record
 * @throws "Database connection unavailable" if Prisma is unavailable
 * @throws "User not found" if userId doesn't exist
 */
export async function logEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<Event> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    // Verify user exists before logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create the event
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
    const event = await prisma.event.create({
      data: {
        id: nanoid(),
        userId,
        eventType: eventType as EventType,
        updatedAt: new Date(),
        ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });

    return event;
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      throw error;
    }
    console.error(
      `Failed to log event: ${eventType} for user ${userId}`,
      error,
    );
    throw error;
  }
}

/**
 * Get all events for a specific user within a date range.
 * @param userId - User ID
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @param eventTypes - Optional filter by event types (only return these types)
 * @returns Event[] ordered by createdAt DESC (most recent first)
 * @throws "Database connection unavailable" if Prisma is unavailable
 */
export async function getUserEventLog(
  userId: string,
  startDate: Date,
  endDate: Date,
  eventTypes?: string[],
): Promise<Event[]> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(eventTypes && eventTypes.length > 0
          ? { eventType: { in: eventTypes as EventType[] } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return events;
  } catch (error) {
    console.error(`Failed to get user event log for user ${userId}`, error);
    throw error;
  }
}

/**
 * Get all events system-wide (admin visibility) within a date range.
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @param eventTypes - Optional filter by event types
 * @param userId - Optional filter by a specific user
 * @returns Event[] ordered by createdAt DESC (most recent first)
 * @throws "Database connection unavailable" if Prisma is unavailable
 */
export async function getSystemEventLog(
  startDate: Date,
  endDate: Date,
  eventTypes?: string[],
  userId?: string,
): Promise<Event[]> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(eventTypes && eventTypes.length > 0
          ? { eventType: { in: eventTypes as EventType[] } }
          : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return events;
  } catch (error) {
    console.error("Failed to get system event log", error);
    throw error;
  }
}

/**
 * Get event statistics (count by event type) for a date range.
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @param userId - Optional filter by a specific user
 * @returns Array of { eventType, count } sorted by count DESC (most frequent first)
 * @throws "Database connection unavailable" if Prisma is unavailable
 */
export async function getEventStats(
  startDate: Date,
  endDate: Date,
  userId?: string,
): Promise<Array<{ eventType: string; count: number }>> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    const stats = await prisma.event.groupBy({
      by: ["eventType"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId ? { userId } : {}),
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    return stats.map((stat) => ({
      eventType: stat.eventType,
      count: stat._count.id,
    }));
  } catch (error) {
    console.error("Failed to get event stats", error);
    throw error;
  }
}

/**
 * Move events older than N days from Event table to EventArchive table.
 * Idempotent: can be called multiple times without creating duplicates.
 * @param olderThanDays - Only archive events created more than N days ago
 * @returns Object with movedCount (number of events moved)
 * @throws "Database connection unavailable" if Prisma is unavailable
 */
export async function archiveOldEvents(
  olderThanDays: number,
): Promise<{ movedCount: number }> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Find all events older than the cutoff
    const oldEvents = await prisma.event.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (oldEvents.length === 0) {
      return { movedCount: 0 };
    }

    // Create archive entries for each old event
    await prisma.eventArchive.createMany({
      data: oldEvents.map((event) => ({
        id: event.id,
        userId: event.userId,
        eventType: event.eventType,
        createdAt: event.createdAt,
        ...(event.metadata !== null
          ? { metadata: event.metadata as Prisma.InputJsonValue }
          : {}),
      })),
      skipDuplicates: true, // Idempotent: skip if already archived
    });

    // Delete the original events
    const deleteResult = await prisma.event.deleteMany({
      where: {
        id: {
          in: oldEvents.map((e) => e.id),
        },
      },
    });

    const movedCount = deleteResult.count;
    console.log(
      `Archived ${movedCount} events older than ${olderThanDays} days`,
    );

    return { movedCount };
  } catch (error) {
    console.error(
      `Failed to archive old events (older than ${olderThanDays} days)`,
      error,
    );
    return { movedCount: 0 };
  }
}

/**
 * Delete events from EventArchive table that were archived more than N days ago.
 * @param olderThanDays - Delete archived events whose archivedAt is older than N days
 * @returns Object with deletedCount (number of events permanently deleted)
 * @throws "Database connection unavailable" if Prisma is unavailable
 */
export async function deleteArchivedEvents(
  olderThanDays: number,
): Promise<{ deletedCount: number }> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    // Calculate cutoff date for archivedAt
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Delete archived events older than cutoff
    const deleteResult = await prisma.eventArchive.deleteMany({
      where: {
        archivedAt: {
          lt: cutoffDate,
        },
      },
    });

    const deletedCount = deleteResult.count;
    console.log(
      `Deleted ${deletedCount} archived events older than ${olderThanDays} days`,
    );

    return { deletedCount };
  } catch (error) {
    console.error(
      `Failed to delete archived events (older than ${olderThanDays} days)`,
      error,
    );
    return { deletedCount: 0 };
  }
}

/**
 * Get the current count of events in the Event table (hot storage).
 * Used for monitoring table size and deciding when to archive.
 * @returns Number of records in the Event table
 * @throws "Database connection unavailable" if Prisma is unavailable
 */
export async function getHotEventCount(): Promise<number> {
  if (!prisma) {
    throw new Error("Database connection unavailable");
  }

  try {
    const count = await prisma.event.count();
    return count;
  } catch (error) {
    console.error("Failed to get hot event count", error);
    throw error;
  }
}
