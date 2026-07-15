import { BarChart3, Pencil, MessageSquare } from "lucide-react";

export type MobileTab = "collection" | "editor" | "helpers";

type MobileBottomNavProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  wordCount?: number;
  progress?: number;
};

export function MobileBottomNav({
  activeTab,
  onTabChange,
  wordCount = 0,
  progress = 0,
}: MobileBottomNavProps) {
  const tabs: Array<{
    id: MobileTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    emoji: string;
  }> = [
    { id: "collection", label: "Коллекция", icon: BarChart3, emoji: "📊" },
    { id: "editor", label: "Редактор", icon: Pencil, emoji: "📝" },
    { id: "helpers", label: "Помощники", icon: MessageSquare, emoji: "💬" },
  ];

  return (
    <div className="flex flex-col border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      {/* Status bar: word count and progress */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <span>Слов: {wordCount}</span>
        {progress > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-600 transition-all dark:bg-zinc-400"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 px-2 transition-colors ${
              activeTab === tab.id
                ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
            } border-b-2 ${
              activeTab === tab.id
                ? "border-zinc-900 dark:border-white"
                : "border-transparent"
            }`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            aria-label={tab.label}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{tab.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
