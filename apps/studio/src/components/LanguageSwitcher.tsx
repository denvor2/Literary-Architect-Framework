'use client';

import { useLocaleContext } from '@/context/LocaleContext';

export function LanguageSwitcher() {
  const { locale, switchLocale } = useLocaleContext();

  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-300 dark:border-zinc-700">
      <button
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          locale === 'en'
            ? 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white'
            : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-950'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <div className="w-px bg-zinc-300 dark:bg-zinc-700" />
      <button
        onClick={() => switchLocale('ru')}
        className={`px-2 py-1 text-xs font-medium transition-colors ${
          locale === 'ru'
            ? 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white'
            : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-950'
        }`}
        aria-label="Switch to Russian"
      >
        РУ
      </button>
    </div>
  );
}
