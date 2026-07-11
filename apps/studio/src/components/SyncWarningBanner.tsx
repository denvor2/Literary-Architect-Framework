"use client";

import type { SyncWarning } from "@/storage/workspaceStorage";

// Sprint-24-Step-08 (ADR-0012 Decision 5): the one visible UI surface for
// `getSyncWarning()` (Sprint-24-Step-07). Deliberately a single conditional
// banner, not a notification system with a queue/history — the Step Card's
// Rules explicitly rule that out for Sprint 24. Style reuses two color
// patterns already established elsewhere in this project rather than
// inventing a third: amber for an ongoing, non-critical warning (matches
// AssistantPanel.tsx's "medium" Critic severity badge), blue for a one-shot
// informational notice (matches EditorArea.tsx's AI field-suggestion box).
export function SyncWarningBanner({
  warning,
}: {
  warning: SyncWarning | null;
}) {
  if (warning === null) return null;

  if (warning === "db-unavailable") {
    return (
      <div className="border-b border-amber-200 bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        База данных временно недоступна — изменения сохраняются локально.
      </div>
    );
  }

  // "recovered-local-wins"
  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      Обнаружено расхождение с базой данных — использованы более свежие
      локальные изменения.
    </div>
  );
}
