import { useState } from "react";
import type {
  Book,
  Chapter,
  Character,
  Idea,
  Series,
  Scene,
} from "@/domain/model";
import { IdeasPanel } from "@/components/IdeasPanel";
import {
  Trash2,
  BookOpen,
  FileText,
  User,
  Lightbulb,
  Trash,
} from "lucide-react";
import { useLocaleContext } from "@/context/LocaleContext";

type SidebarSection = "chapters" | "characters" | "ideas" | "series" | "trash";

type SidebarProps = {
  expandedSidebarSection?: SidebarSection | null;
  onToggleSidebarSection?: (section: SidebarSection) => void;
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
  onDeleteCharacter?: (id: string) => void;
  onSelectBook?: (bookId: string) => void;
  onNewBook?: () => void;
  onDeleteBook?: (bookId: string) => void;
  onCreateChapter?: () => void;
  onDeleteChapter?: (chapterId: string) => void;
  onCreateScene?: (chapterId: string) => void;
  onDeleteScene?: (chapterId: string, sceneId: string) => void;
  // Accordion: chapter expanded if selectedChapterId === chapter.id
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
  onDeleteSeries?: (seriesId: string) => void;
  // Sprint-33-Step-02: Trash system
  deletedBooks?: readonly Book[];
  deletedChapters?: readonly Chapter[];
  deletedScenes?: readonly Scene[];
  deletedCharacters?: readonly Character[];
  deletedIdeas?: readonly Idea[];
  onRestoreBook?: (bookId: string) => void;
  onPermanentlyDeleteBook?: (bookId: string) => void;
  onPermanentlyDeleteChapter?: (chapterId: string) => void;
  onPermanentlyDeleteScene?: (sceneId: string) => void;
  onPermanentlyDeleteCharacter?: (characterId: string) => void;
  onPermanentlyDeleteIdea?: (ideaId: string) => void;
  // Sprint-33-Step-07: Drag-drop support for moving books between series
  onMoveBookToSeries?: (bookId: string, targetSeriesId: string | null) => void;
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
  expandedSidebarSection,
  onToggleSidebarSection,
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
  onDeleteCharacter,
  onSelectBook,
  onNewBook,
  onDeleteBook,
  onCreateChapter,
  onDeleteChapter,
  onCreateScene,
  onDeleteScene,
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
  onDeleteSeries,
  deletedBooks = [],
  deletedChapters = [],
  deletedScenes = [],
  deletedCharacters = [],
  deletedIdeas = [],
  onRestoreBook,
  onPermanentlyDeleteBook,
  onPermanentlyDeleteChapter,
  onPermanentlyDeleteScene,
  onPermanentlyDeleteCharacter,
  onPermanentlyDeleteIdea,
  onMoveBookToSeries,
}: SidebarProps) {
  const { t } = useLocaleContext();
  // Sprint-33-Step-07: Drag-drop state tracking
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  // Sprint-36-Step-01: Local state for "Без серии" (unsorted) collapse
  const [isUnsortedCollapsed, setIsUnsortedCollapsed] = useState(false);

  function handleBookDragStart(
    e: React.DragEvent<HTMLLIElement>,
    bookId: string,
  ) {
    setDraggedBookId(bookId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("bookId", bookId);
  }

  function handleBookDragEnd() {
    setDraggedBookId(null);
    setDragOverTarget(null);
  }

  // Drop target: "Без серии" section
  function handleUnsortedDragOver(
    e: React.DragEvent<HTMLUListElement> | React.DragEvent<HTMLDivElement>,
  ) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget("unsorted");
  }

  function handleUnsortedDragLeave() {
    setDragOverTarget(null);
  }

  function handleUnsortedDrop(
    e: React.DragEvent<HTMLUListElement> | React.DragEvent<HTMLDivElement>,
  ) {
    e.preventDefault();
    const bookId = e.dataTransfer.getData("bookId");
    if (bookId && draggedBookId === bookId) {
      // Drop to "Без серии" (null seriesId)
      onMoveBookToSeries?.(bookId, null);
    }
    setDraggedBookId(null);
    setDragOverTarget(null);
  }

  // Drop target: Series section (both header and content)
  function handleSeriesDragOver(
    e: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLUListElement>,
  ) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleSeriesHeaderDragOver(
    e: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLUListElement>,
    seriesId: string,
  ) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(seriesId);
  }

  function handleSeriesDragLeave(
    e: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLUListElement>,
  ) {
    // Only clear if leaving the series container entirely
    if (e.currentTarget === e.target) {
      setDragOverTarget(null);
    }
  }

  function handleSeriesDrop(
    e: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLUListElement>,
    seriesId: string,
  ) {
    e.preventDefault();
    const bookId = e.dataTransfer.getData("bookId");
    if (bookId && draggedBookId === bookId) {
      // Don't move if already in this series
      const book = books.find((b) => b.id === bookId);
      if (book?.seriesId !== seriesId) {
        onMoveBookToSeries?.(bookId, seriesId);
      }
    }
    setDraggedBookId(null);
    setDragOverTarget(null);
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 md:w-56 md:p-3 md:gap-4">
      {/* SERIES SECTION WITH NESTED BOOKS (NO SEPARATE BOOKS SECTION) */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onToggleSidebarSection?.("series")}
          className="mb-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md px-1 py-1 transition-colors"
          aria-label={
            expandedSidebarSection === "series"
              ? "Свернуть серии"
              : "Развернуть серии"
          }
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-zinc-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("sidebar.books")} ({books.length}), {t("sidebar.series")} (
              {series.length})
            </h2>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            {expandedSidebarSection === "series" ? "▾" : "▸"}
          </span>
        </button>

        {expandedSidebarSection === "series" && (
          <>
            <div className="flex gap-1">
              <button
                onClick={() => onNewBook?.()}
                className="flex-1 rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label="Создать новую книгу"
                title="Новая книга"
              >
                📖 Книга
              </button>
              <button
                onClick={() => onCreateSeries?.()}
                className="flex-1 rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label="Создать новую серию"
                title="Новая серия"
              >
                + Серия
              </button>
            </div>

            {series.length === 0 &&
            books.filter((b) => !b.seriesId).length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                Пока нет серий и книг
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {/* Series items */}
                {series.map((s) => {
                  const isSeriesCollapsed =
                    collapsedSeriesIds?.has(s.id) ?? false;
                  const booksInSeries = books.filter(
                    (b) => b.seriesId === s.id,
                  );
                  return (
                    <li key={s.id}>
                      <div
                        className={`flex items-center gap-1 rounded-md p-2 transition-all ${
                          dragOverTarget === s.id
                            ? "border-2 border-dashed border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30"
                            : ""
                        }`}
                        onDragOver={(e) => handleSeriesHeaderDragOver(e, s.id)}
                        onDragLeave={handleSeriesDragLeave}
                        onDrop={(e) => handleSeriesDrop(e, s.id)}
                      >
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
                          className="flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title={s.description || ""}
                          aria-label={`Редактировать серию ${s.title || "Без названия"}`}
                        >
                          {s.title || "Без названия"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Удалить серию "${s.title || "Без названия"}"?`,
                              )
                            ) {
                              onDeleteSeries?.(s.id);
                            }
                          }}
                          className="rounded-md p-1 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Удалить серию"
                          aria-label={`Удалить серию ${s.title || "Без названия"}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {!isSeriesCollapsed && booksInSeries.length > 0 && (
                        <ul
                          className={`ml-3 mt-1 flex flex-col gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-800 ${
                            dragOverTarget === s.id
                              ? "rounded-md bg-green-50/30 dark:bg-green-950/20"
                              : ""
                          }`}
                          onDragOver={(e) => handleSeriesDragOver(e)}
                          onDragLeave={handleSeriesDragLeave}
                          onDrop={(e) => handleSeriesDrop(e, s.id)}
                        >
                          {booksInSeries.map((book) => (
                            <li
                              key={book.id}
                              draggable
                              onDragStart={(e) =>
                                handleBookDragStart(e, book.id)
                              }
                              onDragEnd={handleBookDragEnd}
                              className={`flex items-center gap-1 transition-opacity ${
                                draggedBookId === book.id ? "opacity-50" : ""
                              }`}
                            >
                              <button
                                onClick={() => onSelectBook?.(book.id)}
                                className={`flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors ${
                                  book.id === activeBookId
                                    ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                                }`}
                                aria-label={`Выбрать книгу ${book.title || "Без названия"}`}
                              >
                                {book.title || "Без названия"}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const response = prompt(
                                    `Введите название книги "${book.title || "Без названия"}" для подтверждения удаления:`,
                                  );
                                  if (
                                    response === (book.title || "Без названия")
                                  ) {
                                    onDeleteBook?.(book.id);
                                  } else if (response !== null) {
                                    alert(
                                      "Название не совпадает. Удаление отменено.",
                                    );
                                  }
                                }}
                                className="rounded-md p-1 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                                title="Удалить книгу"
                                aria-label={`Удалить книгу ${book.title || "Без названия"}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}

                {/* "Без серии" (books without series) */}
                {(() => {
                  const booksWithoutSeries = books.filter((b) => !b.seriesId);
                  if (booksWithoutSeries.length === 0) return null;

                  return (
                    <li>
                      <div
                        className={`flex items-center gap-1 rounded-md p-2 transition-all ${
                          dragOverTarget === "unsorted"
                            ? "border-2 border-dashed border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30"
                            : ""
                        }`}
                        onDragOver={handleUnsortedDragOver}
                        onDragLeave={handleUnsortedDragLeave}
                        onDrop={handleUnsortedDrop}
                      >
                        <button
                          onClick={() =>
                            setIsUnsortedCollapsed(!isUnsortedCollapsed)
                          }
                          aria-label={
                            isUnsortedCollapsed ? "Развернуть" : "Свернуть"
                          }
                          className="shrink-0 rounded-md border border-zinc-300 px-1 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                        >
                          {isUnsortedCollapsed ? "▸" : "▾"}
                        </button>
                        <span className="flex-1 rounded-md px-2 py-1 text-left text-sm text-zinc-600 dark:text-zinc-400">
                          Без серии ({booksWithoutSeries.length})
                        </span>
                      </div>
                      {!isUnsortedCollapsed && (
                        <ul
                          className={`ml-3 mt-1 flex flex-col gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-800 ${
                            dragOverTarget === "unsorted"
                              ? "rounded-md bg-blue-50/30 dark:bg-blue-950/20"
                              : ""
                          }`}
                          onDragOver={handleUnsortedDragOver}
                          onDragLeave={handleUnsortedDragLeave}
                          onDrop={handleUnsortedDrop}
                        >
                          {booksWithoutSeries.map((book) => (
                            <li
                              key={book.id}
                              draggable
                              onDragStart={(e) =>
                                handleBookDragStart(e, book.id)
                              }
                              onDragEnd={handleBookDragEnd}
                              className={`transition-opacity ${
                                draggedBookId === book.id ? "opacity-50" : ""
                              }`}
                            >
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
                                    const response = prompt(
                                      `Введите название книги "${book.title || "Без названия"}" для подтверждения удаления:`,
                                    );
                                    if (
                                      response ===
                                      (book.title || "Без названия")
                                    ) {
                                      onDeleteBook?.(book.id);
                                    } else if (response !== null) {
                                      alert(
                                        "Название не совпадает. Удаление отменено.",
                                      );
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
                    </li>
                  );
                })()}
              </ul>
            )}
          </>
        )}
      </div>

      {/* CHAPTERS SECTION */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onToggleSidebarSection?.("chapters")}
          className="mb-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md px-1 py-1 transition-colors"
          aria-label={
            expandedSidebarSection === "chapters"
              ? "Свернуть главы"
              : "Развернуть главы"
          }
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-zinc-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("sidebar.chapters")} ({chapters.length})
            </h2>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            {expandedSidebarSection === "chapters" ? "▾" : "▸"}
          </span>
        </button>
        {expandedSidebarSection === "chapters" && (
          <>
            {chapters.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                {t("sidebar.empty_chapters")}
              </p>
            ) : (
              <>
                <button
                  onClick={() => onCreateChapter?.()}
                  className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  aria-label="Создать новую главу"
                >
                  + Новая глава
                </button>
                <ul className="flex flex-col gap-2">
                  {chapters.map((chapter) => {
                    const isChapterExpanded = selectedChapterId === chapter.id;
                    const isChapterCollapsed = !isChapterExpanded;
                    return (
                      <li key={chapter.id}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              console.log(
                                "[COLLAPSE] Toggling chapter:",
                                chapter.id,
                                "currently collapsed:",
                                isChapterCollapsed,
                              );
                              onToggleChapterCollapsed?.(chapter.id);
                            }}
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
                              scrollBlockIntoView(
                                `chapter-block-${chapter.id}`,
                              );
                            }}
                            className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
                              selectedChapterId === chapter.id &&
                              !selectedSceneId
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
                          <button
                            onClick={() => {
                              if (
                                confirm(`Удалить главу "${chapter.title}"?`)
                              ) {
                                onDeleteChapter?.(chapter.id);
                              }
                            }}
                            className="rounded-md p-1 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                            title="Удалить главу"
                            aria-label={`Удалить главу ${chapter.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {!isChapterCollapsed && chapter.scenes.length > 0 && (
                          <ul className="ml-3 mt-1 flex flex-col gap-2 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                            {chapter.scenes.map((scene) => (
                              <li key={scene.id}>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      onSelectScene?.(chapter.id, scene.id);
                                      scrollBlockIntoView(
                                        `scene-block-${scene.id}`,
                                      );
                                    }}
                                    className={`flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors ${
                                      selectedChapterId === chapter.id &&
                                      selectedSceneId === scene.id
                                        ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                                        : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                                    }`}
                                    aria-label={`Выбрать сцену ${scene.title}`}
                                  >
                                    {scene.title}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Удалить сцену "${scene.title}"?`,
                                        )
                                      ) {
                                        onDeleteScene?.(chapter.id, scene.id);
                                      }
                                    }}
                                    className="rounded-md p-1 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                                    title="Удалить сцену"
                                    aria-label={`Удалить сцену ${scene.title}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {/* CHARACTERS SECTION */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onToggleSidebarSection?.("characters")}
          className="mb-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md px-1 py-1 transition-colors"
          aria-label={
            expandedSidebarSection === "characters"
              ? "Свернуть персонажей"
              : "Развернуть персонажей"
          }
        >
          <div className="flex items-center gap-2">
            <User size={16} className="text-zinc-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("sidebar.characters")} ({characters.length})
            </h2>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            {expandedSidebarSection === "characters" ? "▾" : "▸"}
          </span>
        </button>
        {expandedSidebarSection === "characters" && (
          <>
            <button
              onClick={() => onCreateCharacter?.()}
              className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              aria-label="Создать нового персонажа"
            >
              + Новый персонаж
            </button>
            {characters.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                Пока нет персонажей
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {characters.map((character) => {
                  const isCharacterSelected =
                    selectedCharacterId === character.id;
                  return (
                    <li key={character.id}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (isCharacterSelected) {
                              // Already selected, keep it selected (no collapse)
                            } else {
                              onSelectCharacter?.(character.id);
                            }
                          }}
                          className={`flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors ${
                            isCharacterSelected
                              ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                          }`}
                          aria-label={`Выбрать персонажа ${character.name || "Без имени"}`}
                        >
                          {character.name || "Без имени"}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Удалить персонажа "${character.name || "Без имени"}"?`,
                              )
                            ) {
                              onDeleteCharacter?.(character.id);
                            }
                          }}
                          className="rounded-md p-1 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Удалить персонажа"
                          aria-label={`Удалить персонажа ${character.name || "Без имени"}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {/* IDEAS SECTION */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onToggleSidebarSection?.("ideas")}
          className="mb-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md px-1 py-1 transition-colors"
          aria-label={
            expandedSidebarSection === "ideas"
              ? "Свернуть идеи"
              : "Развернуть идеи"
          }
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-zinc-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("sidebar.ideas")} ({ideas.length})
            </h2>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            {expandedSidebarSection === "ideas" ? "▾" : "▸"}
          </span>
        </button>
        {expandedSidebarSection === "ideas" && (
          <IdeasPanel
            ideas={ideas}
            onCreate={onCreateIdea}
            onUpdate={onUpdateIdea}
            onDelete={onDeleteIdea}
          />
        )}
      </div>

      {/* TRASH SECTION (REORDERED TO BOTTOM) */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onToggleSidebarSection?.("trash")}
          className="mb-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md px-1 py-1 transition-colors"
          aria-label={
            expandedSidebarSection === "trash"
              ? "Свернуть корзину"
              : "Развернуть корзину"
          }
        >
          <div className="flex items-center gap-2">
            <Trash size={16} className="text-zinc-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("sidebar.trash")}{" "}
              {(() => {
                const total =
                  deletedBooks.length +
                  deletedChapters.length +
                  deletedScenes.length +
                  deletedCharacters.length +
                  deletedIdeas.length;
                return total > 0 ? `(${total})` : "";
              })()}
            </h2>
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            {expandedSidebarSection === "trash" ? "▾" : "▸"}
          </span>
        </button>
        {expandedSidebarSection === "trash" && (
          <>
            {/* Deduplicate deleted items by ID to prevent duplicates in trash display */}
            {(() => {
              const seenIds = new Set<string>();
              const uniqueBooks = deletedBooks.filter((book) => {
                if (seenIds.has(`book-${book.id}`)) return false;
                seenIds.add(`book-${book.id}`);
                return true;
              });
              const uniqueChapters = deletedChapters.filter((chapter) => {
                if (seenIds.has(`chapter-${chapter.id}`)) return false;
                seenIds.add(`chapter-${chapter.id}`);
                return true;
              });
              const uniqueScenes = deletedScenes.filter((scene) => {
                if (seenIds.has(`scene-${scene.id}`)) return false;
                seenIds.add(`scene-${scene.id}`);
                return true;
              });
              const uniqueCharacters = deletedCharacters.filter((character) => {
                if (seenIds.has(`character-${character.id}`)) return false;
                seenIds.add(`character-${character.id}`);
                return true;
              });
              const uniqueIdeas = deletedIdeas.filter((idea) => {
                if (seenIds.has(`idea-${idea.id}`)) return false;
                seenIds.add(`idea-${idea.id}`);
                return true;
              });

              const totalUnique =
                uniqueBooks.length +
                uniqueChapters.length +
                uniqueScenes.length +
                uniqueCharacters.length +
                uniqueIdeas.length;

              return totalUnique === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-600">
                  {t("sidebar.empty_trash")}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {uniqueBooks.map((book) => (
                    <li key={`book-${book.id}`}>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <div className="rounded-md px-2 py-1 text-sm text-zinc-400 dark:text-zinc-600">
                            <div className="truncate">
                              📖 {book.title || "Без названия"}
                            </div>
                            {book.deletedAt && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-700">
                                {new Date(book.deletedAt).toLocaleDateString(
                                  "ru-RU",
                                )}
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
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                  {uniqueChapters.map((chapter) => (
                    <li key={`chapter-${chapter.id}`}>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <div className="rounded-md px-2 py-1 text-sm text-zinc-400 dark:text-zinc-600">
                            <div className="truncate">
                              📄 {chapter.title || "Без названия"}
                            </div>
                            {chapter.deletedAt && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-700">
                                {new Date(chapter.deletedAt).toLocaleDateString(
                                  "ru-RU",
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            console.log(
                              "[TRASH] TODO: Restore chapter",
                              chapter.id,
                            );
                            // TODO: Implement chapter restore
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900 dark:hover:text-green-300"
                          title="Восстановить"
                          aria-label={`Восстановить главу ${chapter.title || "Без названия"}`}
                        >
                          ↩️
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Безвозвратно удалить главу "${chapter.title || "Без названия"}"?`,
                              )
                            ) {
                              onPermanentlyDeleteChapter?.(chapter.id);
                            }
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Удалить безвозвратно"
                          aria-label={`Безвозвратно удалить главу ${chapter.title || "Без названия"}`}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                  {uniqueScenes.map((scene) => (
                    <li key={`scene-${scene.id}`}>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <div className="rounded-md px-2 py-1 text-sm text-zinc-400 dark:text-zinc-600">
                            <div className="truncate">
                              🎬 {scene.title || "Без названия"}
                            </div>
                            {scene.deletedAt && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-700">
                                {new Date(scene.deletedAt).toLocaleDateString(
                                  "ru-RU",
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            console.log(
                              "[TRASH] TODO: Restore scene",
                              scene.id,
                            );
                            // TODO: Implement scene restore
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900 dark:hover:text-green-300"
                          title="Восстановить"
                          aria-label={`Восстановить сцену ${scene.title || "Без названия"}`}
                        >
                          ↩️
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Безвозвратно удалить сцену "${scene.title || "Без названия"}"?`,
                              )
                            ) {
                              onPermanentlyDeleteScene?.(scene.id);
                            }
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Удалить безвозвратно"
                          aria-label={`Безвозвратно удалить сцену ${scene.title || "Без названия"}`}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                  {uniqueCharacters.map((character) => (
                    <li key={`character-${character.id}`}>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <div className="rounded-md px-2 py-1 text-sm text-zinc-400 dark:text-zinc-600">
                            <div className="truncate">
                              👤 {character.name || "Без имени"}
                            </div>
                            {character.deletedAt && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-700">
                                {new Date(
                                  character.deletedAt,
                                ).toLocaleDateString("ru-RU")}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            console.log(
                              "[TRASH] TODO: Restore character",
                              character.id,
                            );
                            // TODO: Implement character restore
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900 dark:hover:text-green-300"
                          title="Восстановить"
                          aria-label={`Восстановить персонажа ${character.name || "Без имени"}`}
                        >
                          ↩️
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Безвозвратно удалить персонажа "${character.name || "Без имени"}"?`,
                              )
                            ) {
                              onPermanentlyDeleteCharacter?.(character.id);
                            }
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Удалить безвозвратно"
                          aria-label={`Безвозвратно удалить персонажа ${character.name || "Без имени"}`}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                  {uniqueIdeas.map((idea) => (
                    <li key={`idea-${idea.id}`}>
                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <div className="rounded-md px-2 py-1 text-sm text-zinc-400 dark:text-zinc-600">
                            <div className="truncate">💡 Идея</div>
                            {idea.deletedAt && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-700">
                                {new Date(idea.deletedAt).toLocaleDateString(
                                  "ru-RU",
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            console.log("[TRASH] TODO: Restore idea", idea.id);
                            // TODO: Implement idea restore
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900 dark:hover:text-green-300"
                          title="Восстановить"
                          aria-label="Восстановить идею"
                        >
                          ↩️
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Безвозвратно удалить идею?`)) {
                              onPermanentlyDeleteIdea?.(idea.id);
                            }
                          }}
                          className="rounded-md p-1 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                          title="Удалить безвозвратно"
                          aria-label="Безвозвратно удалить идею"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </>
        )}
      </div>
    </aside>
  );
}
