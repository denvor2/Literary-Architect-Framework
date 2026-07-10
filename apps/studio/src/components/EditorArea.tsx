import { useState } from "react";
import type { Book, Chapter } from "@/domain/model";
import { GENRES, LANGUAGES } from "@/components/NewBookDialog";

// Sprint-13-Step-05: pure scene/chapter/book editing again — the AI
// interaction that used to live here (SceneImprove, MODE_INFO, and the
// Critic/Reader review rendering) moved to AssistantPanel.tsx, which is now
// the single functional AI surface (previously duplicated: this file's
// working dropdown+button, and AssistantPanel.tsx's decorative, unwired
// card list).
//
// Sprint-16-17-Step-02: the three mutually exclusive screens (book overview /
// chapter overview / single-scene editor) are gone — replaced by one
// continuous, scrollable view of the whole book (requisites, then every
// chapter with its scenes' text inline and editable). `selectedChapterId`/
// `selectedSceneId` no longer choose which screen to render; `Sidebar`
// instead scrolls the corresponding block into view (see Sidebar.tsx).
// `textareaRef` (owned by page.tsx, read by AssistantPanel.tsx for Critic/
// Reader/Editor scoping) is no longer attached via JSX `ref` to one fixed
// `<textarea>` — with many scenes visible at once, page.tsx now reassigns it
// on every scene `<textarea>`'s `onFocus` via the `onSceneFocus` callback
// below, so it always points at whichever scene the author last clicked
// into.

type EditorAreaProps = {
  book?: Book | null;
  chapters?: readonly Chapter[];
  onNewScene?: (chapterId: string) => void;
  onChangeSceneText?: (
    chapterId: string,
    sceneId: string,
    text: string,
  ) => void;
  onUpdateChapter?: (
    chapterId: string,
    fields: Partial<Pick<Chapter, "title" | "subtitle">>,
  ) => void;
  onUpdateSceneTitle?: (
    chapterId: string,
    sceneId: string,
    title: string,
  ) => void;
  onUpdateBook?: (
    bookId: string,
    fields: Partial<
      Pick<
        Book,
        | "title"
        | "genre"
        | "language"
        | "premise"
        | "shortAnnotation"
        | "fullAnnotation"
        | "tags"
      >
    >,
  ) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  // Sprint-16-17-Step-02: replaces the single `textareaRef` prop — carries
  // the focused scene's own DOM node up to page.tsx, since there is no
  // longer exactly one `<textarea>` on screen to attach a ref to directly.
  onSceneFocus?: (
    chapterId: string,
    sceneId: string,
    element: HTMLTextAreaElement,
  ) => void;
  // Sprint-16-17-Step-03: collapse/expand state at every level — ephemeral,
  // owned by page.tsx (shared with Sidebar.tsx's tree indicators, see
  // there), not part of Workspace/domain.
  isChaptersCollapsed?: boolean;
  onToggleChaptersCollapsed?: () => void;
  collapsedChapterIds?: ReadonlySet<string>;
  onToggleChapterCollapsed?: (chapterId: string) => void;
  collapsedSceneIds?: ReadonlySet<string>;
  onToggleSceneCollapsed?: (sceneId: string) => void;
  onToggleAllScenesInChapter?: (chapterId: string) => void;
};

export function EditorArea({
  book,
  chapters = [],
  onNewScene,
  onChangeSceneText,
  onUpdateChapter,
  onUpdateSceneTitle,
  onUpdateBook,
  isFocusMode = false,
  onToggleFocusMode,
  onSceneFocus,
  isChaptersCollapsed = false,
  onToggleChaptersCollapsed,
  collapsedChapterIds,
  onToggleChapterCollapsed,
  collapsedSceneIds,
  onToggleSceneCollapsed,
  onToggleAllScenesInChapter,
}: EditorAreaProps) {
  if (!book) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Создайте первую книгу, чтобы начать
        </p>
      </main>
    );
  }

  return (
    <UnifiedBookView
      book={book}
      chapters={chapters}
      onNewScene={onNewScene}
      onChangeSceneText={onChangeSceneText}
      onUpdateChapter={onUpdateChapter}
      onUpdateSceneTitle={onUpdateSceneTitle}
      onUpdateBook={onUpdateBook}
      isFocusMode={isFocusMode}
      onToggleFocusMode={onToggleFocusMode}
      onSceneFocus={onSceneFocus}
      isChaptersCollapsed={isChaptersCollapsed}
      onToggleChaptersCollapsed={onToggleChaptersCollapsed}
      collapsedChapterIds={collapsedChapterIds}
      onToggleChapterCollapsed={onToggleChapterCollapsed}
      collapsedSceneIds={collapsedSceneIds}
      onToggleSceneCollapsed={onToggleSceneCollapsed}
      onToggleAllScenesInChapter={onToggleAllScenesInChapter}
    />
  );
}

type UnifiedBookViewProps = Omit<EditorAreaProps, "book" | "chapters"> & {
  book: Book;
  chapters: readonly Chapter[];
};

function UnifiedBookView({
  book,
  chapters,
  onNewScene,
  onChangeSceneText,
  onUpdateChapter,
  onUpdateSceneTitle,
  onUpdateBook,
  isFocusMode = false,
  onToggleFocusMode,
  onSceneFocus,
  isChaptersCollapsed = false,
  onToggleChaptersCollapsed,
  collapsedChapterIds,
  onToggleChapterCollapsed,
  collapsedSceneIds,
  onToggleSceneCollapsed,
  onToggleAllScenesInChapter,
}: UnifiedBookViewProps) {
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

  return (
    <main className="flex flex-1 flex-col overflow-y-auto p-8">
      <div
        className={`flex w-full flex-1 flex-col gap-6 ${
          isFocusMode ? "mx-auto max-w-3xl" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Реквизиты книги
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onToggleFocusMode}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {isFocusMode ? "Выйти из фокуса" : "Фокус"}
            </button>
            <button
              onClick={() => setIsDetailsCollapsed((value) => !value)}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {isDetailsCollapsed ? "Развернуть" : "Свернуть"}
            </button>
          </div>
        </div>
        {!isDetailsCollapsed && (
          <div className="flex max-w-2xl flex-col gap-2">
            <input
              value={book.title}
              onChange={(event) =>
                onUpdateBook?.(book.id, { title: event.target.value })
              }
              placeholder="Название книги..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-2xl font-semibold tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <div className="flex gap-2">
              <select
                value={book.genre}
                onChange={(event) =>
                  onUpdateBook?.(book.id, { genre: event.target.value })
                }
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {GENRES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={book.language}
                onChange={(event) =>
                  onUpdateBook?.(book.id, { language: event.target.value })
                }
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {LANGUAGES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={book.premise}
              onChange={(event) =>
                onUpdateBook?.(book.id, { premise: event.target.value })
              }
              placeholder="О чём эта книга?"
              rows={4}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            />
            <input
              value={book.tags.join(", ")}
              onChange={(event) =>
                onUpdateBook?.(book.id, {
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0),
                })
              }
              placeholder="Теги (через запятую)..."
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            />
            <textarea
              value={book.shortAnnotation}
              onChange={(event) =>
                onUpdateBook?.(book.id, {
                  shortAnnotation: event.target.value,
                })
              }
              placeholder="Краткая аннотация..."
              rows={2}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            />
            <textarea
              value={book.fullAnnotation}
              onChange={(event) =>
                onUpdateBook?.(book.id, { fullAnnotation: event.target.value })
              }
              placeholder="Полная аннотация..."
              rows={6}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </div>
        )}

        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Главы
            </h2>
            {chapters.length > 0 && (
              <button
                onClick={onToggleChaptersCollapsed}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                {isChaptersCollapsed
                  ? "Развернуть все главы"
                  : "Свернуть все главы"}
              </button>
            )}
          </div>
          {chapters.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              Пока нет глав
            </p>
          ) : isChaptersCollapsed ? null : (
            chapters.map((chapter) => {
              const isChapterCollapsed =
                collapsedChapterIds?.has(chapter.id) ?? false;
              const allScenesCollapsed =
                chapter.scenes.length > 0 &&
                chapter.scenes.every((scene) =>
                  collapsedSceneIds?.has(scene.id),
                );

              return (
                <div
                  key={chapter.id}
                  id={`chapter-block-${chapter.id}`}
                  className="flex flex-col gap-4 border-t border-zinc-200 pt-6 first:border-t-0 first:pt-0 dark:border-zinc-800"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => onToggleChapterCollapsed?.(chapter.id)}
                      aria-label={
                        isChapterCollapsed
                          ? "Развернуть главу"
                          : "Свернуть главу"
                      }
                      className="mt-2 shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      {isChapterCollapsed ? "▸" : "▾"}
                    </button>
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        value={chapter.title}
                        onChange={(event) =>
                          onUpdateChapter?.(chapter.id, {
                            title: event.target.value,
                          })
                        }
                        placeholder="Название главы..."
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xl font-semibold tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                      {!isChapterCollapsed && (
                        <input
                          value={chapter.subtitle ?? ""}
                          onChange={(event) =>
                            onUpdateChapter?.(chapter.id, {
                              subtitle: event.target.value,
                            })
                          }
                          placeholder="Подзаголовок..."
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                        />
                      )}
                    </div>
                  </div>

                  {!isChapterCollapsed &&
                    (chapter.scenes.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Пока нет сцен
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            onToggleAllScenesInChapter?.(chapter.id)
                          }
                          className="self-start rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                        >
                          {allScenesCollapsed
                            ? "Развернуть все сцены главы"
                            : "Свернуть все сцены главы"}
                        </button>
                        <div className="flex flex-col gap-6 pl-4">
                          {chapter.scenes.map((scene) => {
                            const trimmed = scene.text.trim();
                            const wordCount =
                              trimmed === "" ? 0 : trimmed.split(/\s+/).length;
                            const characterCount = scene.text.length;
                            const textareaId = `scene-textarea-${scene.id}`;
                            const isSceneCollapsed =
                              collapsedSceneIds?.has(scene.id) ?? false;

                            return (
                              <div
                                key={scene.id}
                                id={`scene-block-${scene.id}`}
                                className="flex flex-col gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      onToggleSceneCollapsed?.(scene.id)
                                    }
                                    aria-label={
                                      isSceneCollapsed
                                        ? "Развернуть сцену"
                                        : "Свернуть сцену"
                                    }
                                    className="shrink-0 rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                                  >
                                    {isSceneCollapsed ? "▸" : "▾"}
                                  </button>
                                  <input
                                    value={scene.title}
                                    onChange={(event) =>
                                      onUpdateSceneTitle?.(
                                        chapter.id,
                                        scene.id,
                                        event.target.value,
                                      )
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        document
                                          .getElementById(textareaId)
                                          ?.focus();
                                      }
                                    }}
                                    placeholder="Название сцены..."
                                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-base font-medium tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                  />
                                </div>
                                {!isSceneCollapsed && (
                                  <>
                                    <textarea
                                      id={textareaId}
                                      value={scene.text}
                                      onChange={(event) =>
                                        onChangeSceneText?.(
                                          chapter.id,
                                          scene.id,
                                          event.target.value,
                                        )
                                      }
                                      onFocus={(event) =>
                                        onSceneFocus?.(
                                          chapter.id,
                                          scene.id,
                                          event.currentTarget,
                                        )
                                      }
                                      placeholder="Начните писать сцену..."
                                      rows={8}
                                      className="w-full resize-none rounded-md bg-transparent p-3 text-base leading-relaxed text-black outline-none dark:text-white"
                                    />
                                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                                      Слов: {wordCount} · Символов:{" "}
                                      {characterCount}
                                    </p>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ))}
                  {!isChapterCollapsed && (
                    <button
                      onClick={() => onNewScene?.(chapter.id)}
                      className="self-start rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      + Новая сцена
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
