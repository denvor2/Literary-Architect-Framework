"use client";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Управление пользователями
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          User Management
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-lg font-semibold text-black dark:text-white">
          Coming in Sprint 45+
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Управление пользователями будет реализовано в Sprint 45
        </p>
      </div>
    </div>
  );
}
