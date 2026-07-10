import type { Idea } from "@/domain/model";

type IdeasPanelProps = {
  ideas: readonly Idea[];
  onCreate?: () => void;
  onUpdate?: (ideaId: string, text: string) => void;
  onDelete?: (ideaId: string) => void;
};

function formatDate(isoString: string): string {
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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Идеи и заметки
        </h2>
        <button
          onClick={onCreate}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          + Добавить заметку
        </button>
      </div>

      {ideas.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Пока нет заметок
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {formatDate(idea.createdAt)}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm("Удалить заметку?")) {
                      onDelete?.(idea.id);
                    }
                  }}
                  className="rounded-full border border-red-300 px-2 py-0.5 text-xs text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Удалить
                </button>
              </div>
              <textarea
                value={idea.text}
                onChange={(event) => onUpdate?.(idea.id, event.target.value)}
                placeholder="Текст заметки..."
                rows={3}
                className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
