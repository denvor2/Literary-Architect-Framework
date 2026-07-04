import type { Chapter } from "@/domain/model";

type SidebarProps = {
  bookTitle?: string;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onSelectChapter?: (id: string) => void;
  onSelectScene?: (chapterId: string, sceneId: string) => void;
};

export function Sidebar({
  bookTitle,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onSelectChapter,
  onSelectScene,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Book
        </h2>
        <p className="text-sm text-black dark:text-zinc-100">
          {bookTitle ?? "Untitled Book"}
        </p>
      </div>
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Chapters
        </h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No chapters yet
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  onClick={() => onSelectChapter?.(chapter.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    selectedChapterId === chapter.id && !selectedSceneId
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {chapter.title}
                </button>
                {chapter.scenes.length > 0 && (
                  <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {chapter.scenes.map((scene) => (
                      <li key={scene.id}>
                        <button
                          onClick={() => onSelectScene?.(chapter.id, scene.id)}
                          className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                            selectedSceneId === scene.id
                              ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {scene.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
