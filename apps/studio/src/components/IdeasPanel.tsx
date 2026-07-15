"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Idea } from "@/domain/model";

type IdeasPanelProps = {
  ideas: readonly Idea[];
  onCreate?: () => void;
  onUpdate?: (ideaId: string, text: string) => void;
  onDelete?: (ideaId: string) => void;
};

function formatDateExpanded(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IdeasPanel({
  ideas,
  onCreate,
  onUpdate,
  onDelete,
}: IdeasPanelProps) {
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  const toggleExpanded = (ideaId: string) => {
    // Accordion: toggle selected idea
    setExpandedIdeaId((previous) =>
      previous === ideaId ? null : ideaId,
    );
  };

  const isExpanded = (ideaId: string) => expandedIdeaId === ideaId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Идеи ({ideas.length})
        </h2>
        <button
          onClick={onCreate}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          + Добавить идею
        </button>
      </div>

      {ideas.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Пока нет идей
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ideas.map((idea) => (
            <div key={idea.id} id={`idea-block-${idea.id}`}>
              {isExpanded(idea.id) || idea.text === "" ? (
                // Expanded view
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      {formatDateExpanded(idea.createdAt)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleExpanded(idea.id)}
                        className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      >
                        Свернуть
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Удалить заметку?")) {
                            onDelete?.(idea.id);
                          }
                        }}
                        className="shrink-0 text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Удалить"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={idea.text}
                    onChange={(event) =>
                      onUpdate?.(idea.id, event.target.value)
                    }
                    placeholder="Текст заметки..."
                    rows={3}
                    className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              ) : (
                // Collapsed view - single line with truncation
                <div className="flex items-center justify-between gap-2 p-2">
                  <button
                    onClick={() => toggleExpanded(idea.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="line-clamp-1 text-sm text-zinc-900 dark:text-zinc-100">
                      {idea.text}
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Удалить заметку?")) {
                        onDelete?.(idea.id);
                      }
                    }}
                    className="shrink-0 text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Удалить"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
