"use client";

import React from "react";

interface Stats {
  words: number;
  charsWithSpaces: number;
  charsNoSpaces: number;
}

interface StatsFooterProps {
  stats: Stats;
}

/**
 * Sprint-38-Step-01: Word and character statistics footer component
 * Displays real-time statistics for the active book:
 * - Word count
 * - Character count (with spaces)
 * - Character count (without spaces)
 */
export function StatsFooter({ stats }: StatsFooterProps) {
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="flex items-center justify-center border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <span className="whitespace-nowrap">
        Слов:{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-200">
          {formatNumber(stats.words)}
        </span>
      </span>
      <span className="mx-3 text-zinc-300 dark:text-zinc-700">|</span>
      <span className="whitespace-nowrap">
        Знаков:{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-200">
          {formatNumber(stats.charsWithSpaces)}
        </span>
      </span>
      <span className="mx-3 text-zinc-300 dark:text-zinc-700">|</span>
      <span className="whitespace-nowrap">
        Без пробелов:{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-200">
          {formatNumber(stats.charsNoSpaces)}
        </span>
      </span>
    </div>
  );
}
