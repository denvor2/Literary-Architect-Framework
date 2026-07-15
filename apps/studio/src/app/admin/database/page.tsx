"use client";

export default function AdminDatabasePage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Инспектор базы данных
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Database Inspector
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-lg font-semibold text-black dark:text-white">
          Coming in Sprint 45+
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Инспекция базы данных будет реализована в Sprint 45
        </p>
      </div>
    </div>
  );
}
