"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthController } from "@/hooks/useAuthController";

type AdminLayoutProps = {
  children: ReactNode;
};

const ADMIN_SECTIONS = [
  { name: "Dashboard", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Logs", href: "/admin/logs" },
  { name: "Billing", href: "/admin/billing" },
  { name: "Database", href: "/admin/database" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { auth } = useAuthController();

  // Component-level guard: only admin role can access
  if (!auth.isLoggedIn || auth.user?.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Вы не имеете прав доступа к администраторской панели.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-500"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col gap-0">
      {/* Admin Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-black">
        <h1 className="text-sm font-semibold text-black dark:text-white">
          Администраторская панель
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Вернуться
          </Link>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Admin Sidebar Navigation */}
        <div className="w-48 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex flex-col gap-1 p-3">
            {ADMIN_SECTIONS.map((section) => {
              const isActive = pathname === section.href;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                      : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {section.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-white dark:bg-black">
          {children}
        </div>
      </div>
    </div>
  );
}
