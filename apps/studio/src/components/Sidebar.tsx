import type { Book, Chapter, Character, Idea, Series } from "@/domain/model";
import { IdeasPanel } from "@/components/IdeasPanel";
import { Trash2 } from "lucide-react";

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
  onDeleteBook?: (bookId: string) => void;
  onCreateChapter?: () => void;
  onCreateScene?: (chapterId: string) => void;
  // Sprint-16-17-Step-03: same collapse state as EditorArea.tsx's chapter
  // blocks (lifted to page.tsx) — the tree's expand/collapse indicator stays
  // in sync with the unified view instead of tracking its own copy.
  collapsedChapterIds?: ReadonlySet<string>;
  onToggleChapterCollapsed?: (chapterId: string) => void;
  // Sprint-25-Step-01: Ideas/Notes relocated here from EditorArea.tsx's
  // UnifiedBookView (Sprint 18 Step 03) — pure rendering move, IdeasPanel
  // itself is unchanged.
  ideas?: readonly Idea[];
  onCreateIdea?: () => void;
  onUpdateIdea?: (ideaId: string, text: string) => void;
  onDeleteIdea?: (ideaId: string) => void;
  // Sprint-29-Step-06: Series support
  series?: readonly Series[];
  collapsedSeriesIds?: ReadonlySet<string>;
  onToggleSeriesCollapsed?: (seriesId: string) => void;
  onCreateSeries?: () => void;
  onEditSeries?: (seriesId: string) => void;
  // Sprint-33-Step-02: Trash system
  deletedBooks?: readonly Book[];
  onRestoreBook?: (bookId: string) => void;
  onPermanentlyDeleteBook?: (bookId: string) => void;
};

// Sprint-16-17-Step-02: the unified view (EditorArea.tsx) shows every
// chapter/scene at once, so a tree click no longer switches screens — it
// scrolls the corresponding block into view. Selection is still recorded via
// `onSelectChapter`/`onSelectScene` (restores scroll position on reload,
// drives the highlight below), it just isn't the thing that decides what
// EditorArea renders anymore.
function scrollBlockIntoView(elementId: string) {
  document
    .getElementById(elementId)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
  onDeleteBook,
  onCreateChapter,
  onCreateScene,
  collapsedChapterIds,
  onToggleChapterCollapsed,
  ideas = [],
  onCreateIdea,
  onUpdateIdea,
  onDeleteIdea,
  series = [],
  collapsedSeriesIds,
  onToggleSeriesCollapsed,
  onCreateSeries,
  onEditSeries,
  deletedBooks = [],
  onRestoreBook,
  onPermanentlyDeleteBook,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 md:w-56 md:p-3 md:gap-4">
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Книга
          </h2>
          <button
            onClick={() => onNewBook?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            aria-label="Создать новую книгу"
          >
            + Новая книга
          </button>
        </div>
        {books.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет книг
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {books.map((book) => (
              <li key={book.id}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectBook?.(book.id)}
                    className={`flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors ${
                      book.id === activeBookId
                        ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                        : "text-black hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                    aria-label={`Выбрать книгу ${book.title || "Без названия"}`}
                  >
                    {book.title || "Без названия"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Удалить книгу "${book.title || "Без названия"}"?`,
                        )
                      ) {
                        onDeleteBook?.(book.id);
                      }
                    }}
                    className="rounded-md p-1 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                    title="Удалить книгу"
                    aria-label={`Удалить книгу ${book.title || "Без названия"}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Серии
          </h2>
          <button
            onClick={() => onCreateSeries?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            aria-label="Создать новую серию"
          >
            +
          </button>
        </div>
        {series.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет серий
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {series.map((s) => {
              const isSeriesCollapsed = collapsedSeriesIds?.has(s.id) ?? false;
              const booksInSeries = books.filter((b) => b.seriesId === s.id);
              return (
                <li key={s.id}>
                  <div className="flex items-center gap-1">
                    {booksInSeries.length > 0 && (
                      <button
                        onClick={() => onToggleSeriesCollapsed?.(s.id)}
                        aria-label={
                          isSeriesCollapsed
                            ? "Развернуть серию"
                            : "Свернуть серию"
                        }
                        className="shrink-0 rounded-md border border-zinc-300 px-1 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      >
                        {isSeriesCollapsed ? "▸" : "▾"}
                      </button>
                    )}
                    {booksInSeries.length === 0 && <div className="w-6" />}
                    <button
                      onClick={() => onEditSeries?.(s.id)}
                      className="w-full rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      title={s.description || ""}
                      aria-label={`Редактировать серию ${s.title || "Без названия"}`}
                    >
                      {s.title || "Без названия"}
                    </button>
                  </div>
                  {!isSeriesCollapsed && booksInSeries.length > 0 && (
                    <ul className="ml-3 mt-1 flex flex-col gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                      {booksInSeries.map((book) => (
                        <li key={book.id}>
                          <button
                            onClick={() => onSelectBook?.(book.id)}
                            className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                              book.id === activeBookId
                                ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                            }`}
                            aria-label={`Выбрать книгу ${book.title || "Без названия"}`}
                          >
                            {book.title || "Без названия"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Корзина {deletedBooks.length > 0 && `(${deletedBooks.length})`}
          </h2>
        </div>
        {deletedBooks.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Корзина пуста
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {deletedBooks.map((book) => (
              <li key={book.id}>
                <div className="flex items-center gap-1">
                  <div className="flex-1">
                    <div className="rounded-md px-2 py-1 text-sm text-zinc-400 dark:text-zinc-600">
                      <div className="truncate">
                        {book.title || "Без названия"}
                      </div>
                      {book.deletedAt && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-700">
                          {new Date(book.deletedAt).toLocaleDateString("ru-RU")}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRestoreBook?.(book.id)}
                    className="rounded-md p-1 text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900 dark:hover:text-green-300"
                    title="Восстановить"
                    aria-label={`Восстановить книгу ${book.title || "Без названия"}`}
                  >
                    ↩️
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Безвозвратно удалить "${book.title || "Без названия"}"?`,
                        )
                      ) {
                        onPermanentlyDeleteBook?.(book.id);
                      }
                    }}
                    className="rounded-md p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                    title="Удалить безвозвратно"
                    aria-label={`Безвозвратно удалить книгу ${book.title || "Без названия"}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Главы
          </h2>
          <button
            onClick={() => onCreateChapter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            aria-label="Создать новую главу"
          >
            + Новая глава
          </button>
        </div>
        {chapters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет глав
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {chapters.map((chapter) => {
              const isChapterCollapsed =
                collapsedChapterIds?.has(chapter.id) ?? false;
              return (
                <li key={chapter.id}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleChapterCollapsed?.(chapter.id)}
                      aria-label={
                        isChapterCollapsed
                          ? "Развернуть главу"
                          : "Свернуть главу"
                      }
                      className="shrink-0 rounded-md border border-zinc-300 px-1 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      {isChapterCollapsed ? "▸" : "▾"}
                    </button>
                    <button
                      onClick={() => {
                        onSelectChapter?.(chapter.id);
                        scrollBlockIntoView(`chapter-block-${chapter.id}`);
                      }}
                      className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                        selectedChapterId === chapter.id && !selectedSceneId
                          ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      }`}
                      aria-label={`Выбрать главу ${chapter.title}`}
                    >
                      {chapter.title}
                    </button>
                    <button
                      onClick={() => onCreateScene?.(chapter.id)}
                      className="shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      aria-label={`Создать новую сцену в главе ${chapter.title}`}
                    >
                      + Новая сцена
                    </button>
                  </div>
                  {!isChapterCollapsed && chapter.scenes.length > 0 && (
                    <ul className="ml-3 mt-1 flex flex-col gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                      {chapter.scenes.map((scene) => (
                        <li key={scene.id}>
                          <button
                            onClick={() => {
                              onSelectScene?.(chapter.id, scene.id);
                              scrollBlockIntoView(`scene-block-${scene.id}`);
                            }}
                            className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                              selectedChapterId === chapter.id &&
                              selectedSceneId === scene.id
                                ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                            }`}
                            aria-label={`Выбрать сцену ${scene.title}`}
                          >
                            {scene.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Персонажи
          </h2>
          <button
            onClick={() => onCreateCharacter?.()}
            className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            aria-label="Создать нового персонажа"
          >
            + Новый персонаж
          </button>
        </div>
        {characters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            Пока нет персонажей
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {characters.map((character) => (
              <li key={character.id}>
                <button
                  onClick={() => onSelectCharacter?.(character.id)}
                  className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                    selectedCharacterId === character.id
                      ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                  aria-label={`Выбрать персонажа ${character.name || "Без имени"}`}
                >
                  {character.name || "Без имени"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <IdeasPanel
          ideas={ideas}
          onCreate={onCreateIdea}
          onUpdate={onUpdateIdea}
          onDelete={onDeleteIdea}
        />
      </div>
    </aside>
  );
}
