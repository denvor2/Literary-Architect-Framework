"use client";

import { BottomSheet } from "./BottomSheet";
import { useLocaleContext } from "@/context/LocaleContext";
import {
  Download,
  Upload,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  LogOut,
  Info,
} from "lucide-react";

type SettingsAction =
  | "export_book"
  | "import_book"
  | "theme_light"
  | "theme_dark"
  | "theme_system"
  | "language_en"
  | "language_ru"
  | "help"
  | "about"
  | "logout";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: "light" | "dark" | "auto";
  currentLocale?: "en" | "ru";
  onSettingsAction: (action: SettingsAction) => void;
}

export function SettingsSheet({
  isOpen,
  onClose,
  currentTheme = "auto",
  currentLocale = "ru",
  onSettingsAction,
}: SettingsSheetProps) {
  const { t } = useLocaleContext();

  const handleAction = (action: SettingsAction) => {
    onSettingsAction(action);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} showDragHandle={true}>
      <div className="flex flex-col gap-0">
        {/* File Section */}
        <div className="mb-4">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("settings.file") || "Файл"}
          </div>
          <button
            onClick={() => handleAction("export_book")}
            className="flex items-center gap-3 w-full px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
          >
            <Download className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>{t("settings.export_book") || "Экспортировать книгу"}</span>
          </button>
          <button
            onClick={() => handleAction("import_book")}
            className="flex items-center gap-3 w-full px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
          >
            <Upload className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>{t("settings.import_book") || "Импортировать книгу"}</span>
          </button>
        </div>

        {/* View Section */}
        <div className="mb-4">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("settings.view") || "Вид"}
          </div>

          {/* Theme */}
          <div className="px-4 py-3">
            <div className="mb-2 text-sm font-medium text-black dark:text-white">
              {t("settings.theme") || "Тема"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("theme_light")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors ${
                  currentTheme === "light"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-300 bg-white text-black hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs">
                  {t("settings.light") || "Светлая"}
                </span>
              </button>
              <button
                onClick={() => handleAction("theme_dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors ${
                  currentTheme === "dark"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-300 bg-white text-black hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span className="text-xs">
                  {t("settings.dark") || "Темная"}
                </span>
              </button>
              <button
                onClick={() => handleAction("theme_system")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors ${
                  currentTheme === "auto"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-300 bg-white text-black hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs">
                  {t("settings.system") || "Система"}
                </span>
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="px-4 py-3">
            <div className="mb-2 text-sm font-medium text-black dark:text-white">
              {t("settings.language") || "Язык"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("language_en")}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                  currentLocale === "en"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-300 bg-white text-black hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleAction("language_ru")}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                  currentLocale === "ru"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-300 bg-white text-black hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                }`}
              >
                Русский
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-4">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("settings.help") || "Помощь"}
          </div>
          <button
            onClick={() => handleAction("help")}
            className="flex items-center gap-3 w-full px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
          >
            <HelpCircle className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>{t("settings.guide") || "Руководство"}</span>
          </button>
          <button
            onClick={() => handleAction("about")}
            className="flex items-center gap-3 w-full px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
          >
            <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>{t("settings.about") || "О программе"}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Logout */}
        <button
          onClick={() => handleAction("logout")}
          className="flex items-center gap-3 w-full px-4 py-3 text-left text-base text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("common.logout") || "Выход"}</span>
        </button>
      </div>
    </BottomSheet>
  );
}
