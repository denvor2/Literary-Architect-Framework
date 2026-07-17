"use client";

import type { SyncWarning } from "@/storage/workspaceStorage";
import { useLocaleContext } from "@/context/LocaleContext";

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
  const { t } = useLocaleContext();

  if (warning === null) return null;

  if (warning === "db-unavailable") {
    return (
      <div className="border-b border-amber-200 bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        {t("sync.db_unavailable")}
      </div>
    );
  }

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      {t("sync.recovered_local_wins")}
    </div>
  );
}
