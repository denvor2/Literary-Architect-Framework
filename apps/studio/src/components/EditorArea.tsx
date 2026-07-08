import type { RefObject } from "react";
import type { Book, Chapter } from "@/domain/model";
import { GENRES, LANGUAGES } from "@/components/NewBookDialog";

// Sprint-13-Step-05: pure scene/chapter/book editing again — the AI
// interaction that used to live here (SceneImprove, MODE_INFO, and the
// Critic/Reader review rendering) moved to AssistantPanel.tsx, which is now
// the single functional AI surface (previously duplicated: this file's
// working dropdown+button, and AssistantPanel.tsx's decorative, unwired
// card list). `textareaRef` is now owned by the parent (page.tsx) — passed
// down as a prop — since AssistantPanel.tsx (a sibling, not a child) needs
// to read the current text selection for Critic/Reader.

type EditorAreaProps = {
  book?: Book | null;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onNewScene?: () => void;
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
  // Sprint-13-Step-05: owned by page.tsx now — AssistantPanel.tsx (a
  // sibling, not a descendant of this component) reads the current
  // selection from the same ref for Critic/Reader scoping.
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
};

export function EditorArea({
  book,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onNewScene,
  onChangeSceneText,
  onUpdateChapter,
  onUpdateSceneTitle,
  onUpdateBook,
  isFocusMode = false,
  onToggleFocusMode,
  textareaRef,
}: EditorAreaProps) {
  if (!book) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Create your first book to get started
        </p>
      </main>
    );
  }

  const selectedChapter = chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );
  const selectedScene = selectedChapter?.scenes.find(
    (scene) => scene.id === selectedSceneId,
  );

  if (selectedChapter && selectedScene) {
    const trimmed = selectedScene.text.trim();
    const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    const characterCount = selectedScene.text.length;

    return (
      <main className="flex flex-1 flex-col overflow-y-auto p-8">
        <div
          className={`flex w-full flex-1 flex-col gap-3 ${
            isFocusMode ? "mx-auto max-w-3xl" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <input
              value={selectedScene.title}
              onChange={(event) =>
                onUpdateSceneTitle?.(
                  selectedChapter.id,
                  selectedScene.id,
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  textareaRef?.current?.focus();
                }
              }}
              placeholder="Scene title..."
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-lg font-medium tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              onClick={onToggleFocusMode}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {isFocusMode ? "Exit Focus" : "Фокус"}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={selectedScene.text}
            onChange={(event) =>
              onChangeSceneText?.(
                selectedChapter.id,
                selectedScene.id,
                event.target.value,
              )
            }
            placeholder="Start writing your scene..."
            className="w-full flex-1 resize-none bg-transparent p-6 text-base leading-relaxed text-black outline-none dark:text-white"
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Words: {wordCount} · Characters: {characterCount}
          </p>
        </div>
      </main>
    );
  }

  if (selectedChapter) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <div className="flex w-full max-w-md flex-col gap-2">
          <input
            value={selectedChapter.title}
            onChange={(event) =>
              onUpdateChapter?.(selectedChapter.id, {
                title: event.target.value,
              })
            }
            placeholder="Chapter title..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-2xl font-semibold tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            value={selectedChapter.subtitle ?? ""}
            onChange={(event) =>
              onUpdateChapter?.(selectedChapter.id, {
                subtitle: event.target.value,
              })
            }
            placeholder="Subtitle..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-center text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
        </div>
        {selectedChapter.scenes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No scenes yet
          </p>
        ) : (
          <ul className="text-sm text-zinc-600 dark:text-zinc-400">
            {selectedChapter.scenes.map((scene) => (
              <li key={scene.id}>{scene.title}</li>
            ))}
          </ul>
        )}
        <button
          onClick={onNewScene}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          New Scene
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <input
          value={book.title}
          onChange={(event) =>
            onUpdateBook?.(book.id, { title: event.target.value })
          }
          placeholder="Book title..."
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
          placeholder="What is this book about?"
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
          placeholder="Tags (comma-separated)..."
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
        />
        <textarea
          value={book.shortAnnotation}
          onChange={(event) =>
            onUpdateBook?.(book.id, { shortAnnotation: event.target.value })
          }
          placeholder="Short annotation..."
          rows={2}
          className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />
        <textarea
          value={book.fullAnnotation}
          onChange={(event) =>
            onUpdateBook?.(book.id, { fullAnnotation: event.target.value })
          }
          placeholder="Full annotation..."
          rows={6}
          className="w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />
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
          <ul className="text-sm text-zinc-600 dark:text-zinc-400">
            {chapters.map((chapter) => (
              <li key={chapter.id}>{chapter.title}</li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
