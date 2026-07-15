"use client";

import { AdminAuditPanel } from "@/components/AdminAuditPanel";

export default function AdminLogsPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Логи аудита
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          История всех событий в системе
        </p>
      </div>

      {/* Audit Panel */}
      <AdminAuditPanel />
    </div>
  );
}
