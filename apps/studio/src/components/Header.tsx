import { useEffect, useRef, useState } from "react";

// Sprint-25-Step-01: chrome-only app menu bar — Product Owner explicitly
// confirmed (twice) this is a placeholder for a future full menu (see
// docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md section 11, tentatively
// Sprint 30). Файл/Правка/Вид each open a dropdown with a single disabled
// "Скоро" item — no real Open/Save/Edit/View behavior exists to wire them
// to. The language switcher and "Войти" are the same kind of inert visual
// placeholder (no i18n infrastructure, no auth — auth is Sprint 29).
type MenuKey = "file" | "edit" | "view";

const MENUS: ReadonlyArray<{ key: MenuKey; label: string }> = [
  { key: "file", label: "Файл" },
  { key: "edit", label: "Правка" },
  { key: "view", label: "Вид" },
];

export function Header() {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuBarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-black">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Literary Studio
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Без названия
        </span>
      </div>

      <nav ref={menuBarRef} className="flex items-center gap-1">
        {MENUS.map((menu) => (
          <div key={menu.key} className="relative">
            <button
              onClick={() =>
                setOpenMenu((current) =>
                  current === menu.key ? null : menu.key,
                )
              }
              className="rounded-md px-2 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {menu.label}
            </button>
            {openMenu === menu.key && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-32 rounded-md border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  disabled
                  className="w-full cursor-not-allowed px-3 py-1.5 text-left text-sm text-zinc-400 dark:text-zinc-600"
                >
                  Скоро
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <button
          disabled
          title="Переключение языка интерфейса — скоро"
          className="cursor-not-allowed rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
        >
          RU
        </button>
        <button
          disabled
          title="Вход — скоро"
          className="cursor-not-allowed rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
        >
          Войти
        </button>
      </div>
    </header>
  );
}
