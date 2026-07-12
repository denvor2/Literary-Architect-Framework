import { logEvent } from "@/repositories/auditRepository";

/**
 * Логировать событие, но не блокировать основную операцию если логирование выбросит ошибку.
 * Используется везде, где нужно логировать, но ошибка логирования не должна сломать операцию.
 */
export async function safeLogEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await logEvent(userId, eventType, metadata);
  } catch (error) {
    // Log the error but don't throw
    console.error(
      `[AuditLog] Failed to log event ${eventType} for user ${userId}:`,
      error,
    );
  }
}
