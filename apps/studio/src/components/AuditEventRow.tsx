"use client";

import { useState } from "react";
import { useLocaleContext } from "@/context/LocaleContext";
import type { Event } from "@/generated/prisma/client";

export type AuditEventRowProps = {
  event: Event;
};

export function AuditEventRow({ event }: AuditEventRowProps) {
  const { t } = useLocaleContext();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 text-xs font-medium text-zinc-500">
          {new Date(event.createdAt).toLocaleTimeString()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-xs font-medium">{event.eventType}</div>
          <div className="truncate text-xs text-zinc-500">{event.userId}</div>
        </div>
        <div className="text-xs text-zinc-400">{expanded ? "▼" : "▶"}</div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs">
            <div className="mb-1 font-medium">
              {t("audit.event_id_label")} {event.id}
            </div>
            <div className="mb-1 font-medium">
              {t("audit.user_id_label")} {event.userId}
            </div>
            <div className="mb-1 font-medium">
              {t("audit.created_label")}{" "}
              {new Date(event.createdAt).toISOString()}
            </div>
            {event.metadata && (
              <div className="mb-1">
                <div className="font-medium">{t("audit.metadata_label")}</div>
                <pre className="overflow-auto rounded bg-black/10 p-1 text-xs dark:bg-white/10">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
