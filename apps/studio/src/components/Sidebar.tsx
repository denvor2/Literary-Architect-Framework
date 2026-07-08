import type { Book, Chapter, Character } from "@/domain/model";

type SidebarProps = {
  books?: readonly Book[];
  activeBookId?: string | null;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onSelectChapter?: (id: string) => void;
  onSelectScene?: (chapterId: string, sceneId: string) => void;
  characters?: readonly Character[];
  selectedCharacterId?: string | null;
  onSelectCharacter?: (id: string) => void;
  onCreateCharacter?: () => void;
  onSelectBook?: (bookId: string) => void;
  onNewBook?: () => void;
  onCreateChapter?: () => void;
  onCreateScene?: (chapterId: string) => void;
};

export function Sidebar({
  books = [],
  activeBookId,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onSelectChapter,
  onSelectScene,
  characters = [],
  selectedCharacterId,
  onSelectCharacter,
  onCreateCharacter,
  onSelectBook,
  onNewBook,
  onCreateChapter,
  onCreateScene,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Книга
          </h2>
          <button
            onClick={() => onNewBook?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + Новая книга
          </button>
        </div>
        {books.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет книг
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {books.map((book) => (
              <li key={book.id}>
                <button
                  onClick={() => onSelectBook?.(book.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    book.id === activeBookId
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-black hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {book.title || "Без названия"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Главы
          </h2>
          <button
            onClick={() => onCreateChapter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + Новая глава
          </button>
        </div>
        {chapters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет глав
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <div className="flex items-center gap-1">
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
                  <button
                    onClick={() => onCreateScene?.(chapter.id)}
                    className="shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    + Новая сцена
                  </button>
                </div>
                {chapter.scenes.length > 0 && (
                  <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                    {chapter.scenes.map((scene) => (
                      <li key={scene.id}>
                        <button
                          onClick={() => onSelectScene?.(chapter.id, scene.id)}
                          className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                            selectedChapterId === chapter.id &&
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
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Персонажи
          </h2>
          <button
            onClick={() => onCreateCharacter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + Новый персонаж
          </button>
        </div>
        {characters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет персонажей
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {characters.map((character) => (
              <li key={character.id}>
                <button
                  onClick={() => onSelectCharacter?.(character.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    selectedCharacterId === character.id
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {character.name || "Без имени"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
