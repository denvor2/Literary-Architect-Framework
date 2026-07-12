"use client";

export type CurrentPlanDisplayProps = {
  planName: string;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  tier: string;
  onUpgradeClick?: () => void;
};

export function CurrentPlanDisplay({
  planName,
  daysUntilExpiry,
  isExpired,
  tier,
  onUpgradeClick,
}: CurrentPlanDisplayProps) {
  const isEnterprise = tier === "enterprise";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          План
        </span>
        <span
          className={`text-sm font-medium ${
            isExpired
              ? "text-red-600 dark:text-red-400"
              : "text-black dark:text-zinc-50"
          }`}
        >
          {planName}
        </span>
      </div>
      {daysUntilExpiry !== null && !isExpired && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Осталось {daysUntilExpiry} дней
        </span>
      )}
      {isExpired && (
        <span className="text-xs text-red-600 dark:text-red-400">Истёк</span>
      )}
      {!isEnterprise && (
        <button
          onClick={onUpgradeClick}
          className="mt-1 w-fit rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
        >
          Обновить
        </button>
      )}
    </div>
  );
}
