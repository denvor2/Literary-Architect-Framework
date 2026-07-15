"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Администраторская панель Literary Studio
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Управление системой и пользователями
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Всего пользователей
          </div>
          <div className="mt-2 text-2xl font-bold text-black dark:text-white">
            —
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Coming soon
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Активных сессий
          </div>
          <div className="mt-2 text-2xl font-bold text-black dark:text-white">
            —
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Coming soon
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            События логов
          </div>
          <div className="mt-2 text-2xl font-bold text-black dark:text-white">
            —
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Coming soon
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Статус системы
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            OK
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Все работает нормально
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Быстрые ссылки
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/admin/users"
            className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-sm font-semibold text-black dark:text-white">
              Управление пользователями
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              User Management
            </div>
          </Link>

          <Link
            href="/admin/logs"
            className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-sm font-semibold text-black dark:text-white">
              Логи аудита
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Audit Logs
            </div>
          </Link>

          <Link
            href="/admin/billing"
            className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-sm font-semibold text-black dark:text-white">
              Биллинг и платежи
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Billing & Payments
            </div>
          </Link>

          <Link
            href="/admin/database"
            className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <div className="text-sm font-semibold text-black dark:text-white">
              Инспектор БД
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Database Inspector
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
