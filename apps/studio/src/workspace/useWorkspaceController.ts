"use client";

import { useEffect, useState } from "react";
import type {
  AssistantThread,
  Book,
  Chapter,
  ChatMessage,
  Character,
  Idea,
  Series,
} from "@/domain/model";
import type { Workspace } from "@/domain/workspace";
import {
  getSyncWarning,
  loadWorkspace,
  saveWorkspace,
  type SyncWarning,
} from "@/storage/workspaceStorage";

// Used only as the pre-hydration initial state (see the restore effect
// below) — must match server render, so it cannot itself call
// loadWorkspace(), which depends on window.localStorage.
const EMPTY_WORKSPACE: Workspace = {
  books: [],
  series: [], // Sprint-29-Step-05: initially empty series collection
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
  selectedAssistantMode: "editor",
};

// Owns the Workspace domain state and every operation that mutates it —
// extracted unchanged from page.tsx (Sprint 06 Step 09). No new behavior:
// each exported function here is a straight move of the previous handler,
// same body, same call sites.
//
// Sprint-11-Step-01: rewritten for multi-book Workspace. Every mutation that
// used to read/write `previous.chapters`/`previous.characters` directly now
// finds the active Book via `previous.activeBookId`, applies the change to
// that Book's chapters/characters, and writes the updated Book back into
// `books` (immutable map over `books`, the same way every function used to
// map over `chapters`).
export function useWorkspaceController() {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY_WORKSPACE);
  const [isLoaded, setIsLoaded] = useState(false);
  // Sprint-24-Step-08 (ADR-0012 Decision 5): mirrors Step 07's
  // getSyncWarning() into React state so the UI (SyncWarningBanner) can
  // render it — refreshed after every loadWorkspace()/saveWorkspace() call
  // below, the same two places that already touch the module-level signal.
  const [syncWarning, setSyncWarning] = useState<SyncWarning | null>(null);
  const [deletedBooks, setDeletedBooks] = useState<readonly Book[]>([]);
  const {
    books,
    series,
    activeBookId,
    selectedChapterId,
    selectedSceneId,
    selectedCharacterId,
  } = workspace;

  // Restore the previous workspace once, on mount. This intentionally
  // synchronizes React state from an external system (localStorage, and as
  // of Sprint-24-Step-05/ADR-0012, best-effort the database too), which
  // cannot be read during server rendering — an effect is the correct,
  // hydration-safe place for it.
  //
  // Sprint-24-Step-06: loadWorkspace() is now async (Promise<Workspace>) —
  // awaited inside the effect's own async IIFE (an effect callback itself
  // cannot be async; the setState calls end up inside that IIFE's body
  // rather than directly in the effect body, which is why the linter's
  // set-state-in-effect heuristic — previously suppressed here with an
  // explicit disable comment — no longer fires and the comment was removed
  // as unused). Until the promise resolves, `workspace` stays at its
  // `EMPTY_WORKSPACE` initial state (same as the pre-Sprint-24 synchronous
  // gap between mount and the old, synchronous loadWorkspace() call) — no
  // separate loading screen is introduced, per the Step Card's scope.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await loadWorkspace();
      if (cancelled) return;
      setWorkspace(restored);
      setIsLoaded(true);
      setSyncWarning(getSyncWarning());

      // Load deleted books for trash section (Sprint-33-Step-02)
      try {
        const response = await fetch("/api/workspace?deleted=true", {
          method: "GET",
        });
        if (response.ok) {
          const data = (await response.json()) as {
            ok: boolean;
            deletedBooks?: Book[];
          };
          if (data.deletedBooks) {
            setDeletedBooks(data.deletedBooks);
          }
        }
      } catch {
        // Silently fail — deleted books are optional for display
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the whole workspace under one key whenever it changes — but only
  // after the initial restore above has run, so we never overwrite existing
  // saved data with the default empty state during the first render.
  //
  // Sprint-24-Step-06: saveWorkspace() is now async (Promise<void>) — called
  // without `await` here (rendering must not block on it), with `.catch(() =>
  // {})` guarding only against an unhandled-rejection warning at this call
  // site; saveWorkspace() itself is already guaranteed by its Step-05
  // contract to never reject (localStorage write is synchronous and always
  // succeeds when reached, the database push is best-effort and swallows its
  // own failures). No debounce/throttle added — every workspace change still
  // triggers an attempted write, unchanged from today's localStorage-only
  // behavior.
  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspace(workspace)
      .catch(() => {})
      .finally(() => setSyncWarning(getSyncWarning()));
  }, [workspace, isLoaded]);

  const activeBook = books.find((book) => book.id === activeBookId);
  const chapters = activeBook?.chapters ?? [];
  const characters = activeBook?.characters ?? [];
  const selectedChapter = chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );
  const selectedScene = selectedChapter?.scenes.find(
    (scene) => scene.id === selectedSceneId,
  );
  const selectedCharacter = characters.find(
    (character) => character.id === selectedCharacterId,
  );

  function createBook(
    newBookData: Omit<
      Book,
      | "id"
      | "chapters"
      | "characters"
      | "tags"
      | "shortAnnotation"
      | "fullAnnotation"
      | "assistantThreads"
      | "ideas"
    >,
  ) {
    setWorkspace((previous) => {
      const nextNumber = previous.books.length + 1;
      const newBook: Book = {
        id: String(nextNumber),
        ...newBookData,
        chapters: [
          {
            id: crypto.randomUUID(),
            title: "Chapter 1",
            subtitle: "",
            scenes: [{ id: crypto.randomUUID(), title: "Scene 1", text: "" }],
          },
        ],
        // A new book starts with no characters — the writer adds them later.
        characters: [],
        // New book-level fields (Sprint-11-Step-04) start empty — filled in
        // later via the book overview's editing form, not the creation
        // dialog (kept compact: Title/Genre/Language/Premise only).
        tags: [],
        shortAnnotation: "",
        fullAnnotation: "",
        // Sprint-13-Step-01: one empty dialog per role, same default as
        // normalizeBook() uses for pre-existing books missing this field.
        assistantThreads: {
          coauthor: [
            { id: crypto.randomUUID(), name: "Диалог 1", messages: [] },
          ],
          editor: [{ id: crypto.randomUUID(), name: "Диалог 1", messages: [] }],
          critic: [{ id: crypto.randomUUID(), name: "Диалог 1", messages: [] }],
          reader: [{ id: crypto.randomUUID(), name: "Диалог 1", messages: [] }],
        },
        ideas: [],
      };
      return {
        ...previous,
        books: [...previous.books, newBook],
        activeBookId: newBook.id,
        selectedChapterId: null,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function deleteBook(bookId: string) {
    // Soft delete: call API to mark book as deleted, then update local state
    void (async () => {
      try {
        const response = await fetch(
          `/api/workspace?id=${encodeURIComponent(bookId)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to soft delete book: ${response.status} ${response.statusText}`,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to soft delete book";
        console.error("deleteBook API error:", message);
        throw error;
      }
    })();

    setWorkspace((previous) => {
      const bookToDelete = previous.books.find((book) => book.id === bookId);
      const remainingBooks = previous.books.filter(
        (book) => book.id !== bookId,
      );
      const newActiveBookId =
        previous.activeBookId === bookId
          ? (remainingBooks[0]?.id ?? null)
          : previous.activeBookId;

      // Add book to deletedBooks with deletedAt timestamp
      if (bookToDelete) {
        setDeletedBooks((previous) => [
          { ...bookToDelete, deletedAt: new Date() },
          ...previous,
        ]);
      }

      return {
        ...previous,
        books: remainingBooks,
        activeBookId: newActiveBookId,
        selectedChapterId: null,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function restoreBook(bookId: string): void {
    void (async () => {
      try {
        const response = await fetch(
          `/api/workspace?id=${encodeURIComponent(bookId)}&action=restore`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to restore book: ${response.status} ${response.statusText}`,
          );
        }

        // Remove from deletedBooks and reload active books
        setDeletedBooks((previous) =>
          previous.filter((book) => book.id !== bookId),
        );

        // Reload workspace to reflect restored book
        const restored = await loadWorkspace();
        setWorkspace(restored);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to restore book";
        console.error("restoreBook API error:", message);
        throw error;
      }
    })();
  }

  function permanentlyDeleteBook(bookId: string): void {
    void (async () => {
      try {
        const response = await fetch(
          `/api/workspace?id=${encodeURIComponent(bookId)}&action=permanent`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to permanently delete book: ${response.status} ${response.statusText}`,
          );
        }

        // Remove from deletedBooks
        setDeletedBooks((previous) =>
          previous.filter((book) => book.id !== bookId),
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to permanently delete book";
        console.error("permanentlyDeleteBook API error:", message);
        throw error;
      }
    })();
  }

  function updateBook(
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
  ) {
    setWorkspace((previous) => ({
      ...previous,
      books: previous.books.map((book) =>
        book.id === bookId ? { ...book, ...fields } : book,
      ),
    }));
  }

  function createChapter() {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const nextNumber = activeBook.chapters.length + 1;
      const newChapter: Chapter = {
        id: crypto.randomUUID(),
        title: `Chapter ${nextNumber}`,
        subtitle: "",
        scenes: [{ id: crypto.randomUUID(), title: "Scene 1", text: "" }],
      };
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, chapters: [...book.chapters, newChapter] }
            : book,
        ),
        selectedChapterId: newChapter.id,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function updateChapter(
    chapterId: string,
    fields: Partial<Pick<Chapter, "title" | "subtitle">>,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? { ...chapter, ...fields }
                    : chapter,
                ),
              }
            : book,
        ),
      };
    });
  }

  function createScene(chapterId?: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const targetChapterId = chapterId ?? previous.selectedChapterId;
      if (!targetChapterId) return previous;
      const targetChapter = activeBook.chapters.find(
        (chapter) => chapter.id === targetChapterId,
      );
      if (!targetChapter) return previous;
      const nextNumber = targetChapter.scenes.length + 1;
      const newSceneId = crypto.randomUUID();
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) =>
                  chapter.id === targetChapterId
                    ? {
                        ...chapter,
                        scenes: [
                          ...chapter.scenes,
                          {
                            id: newSceneId,
                            title: `Scene ${nextNumber}`,
                            text: "",
                          },
                        ],
                      }
                    : chapter,
                ),
              }
            : book,
        ),
        selectedChapterId: targetChapterId,
        selectedSceneId: newSceneId,
        selectedCharacterId: null,
      };
    });
  }

  function updateSceneText(chapterId: string, sceneId: string, text: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) => {
                  if (chapter.id !== chapterId) return chapter;
                  return {
                    ...chapter,
                    scenes: chapter.scenes.map((scene) =>
                      scene.id === sceneId ? { ...scene, text } : scene,
                    ),
                  };
                }),
              }
            : book,
        ),
      };
    });
  }

  function updateSceneTitle(chapterId: string, sceneId: string, title: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((chapter) => {
                  if (chapter.id !== chapterId) return chapter;
                  return {
                    ...chapter,
                    scenes: chapter.scenes.map((scene) =>
                      scene.id === sceneId ? { ...scene, title } : scene,
                    ),
                  };
                }),
              }
            : book,
        ),
      };
    });
  }

  function deleteChapter(chapterId: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;

      const remainingChapters = activeBook.chapters.filter(
        (c) => c.id !== chapterId,
      );
      const newSelectedChapterId =
        previous.selectedChapterId === chapterId
          ? (remainingChapters[0]?.id ?? null)
          : previous.selectedChapterId;

      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, chapters: remainingChapters }
            : book,
        ),
        selectedChapterId: newSelectedChapterId,
        selectedSceneId: null,
        selectedCharacterId: null,
      };
    });
  }

  function deleteScene(chapterId: string, sceneId: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;

      const chapter = activeBook.chapters.find((c) => c.id === chapterId);
      if (!chapter) return previous;

      const remainingScenes = chapter.scenes.filter((s) => s.id !== sceneId);
      const newSelectedSceneId =
        previous.selectedSceneId === sceneId
          ? (remainingScenes[0]?.id ?? null)
          : previous.selectedSceneId;

      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                chapters: book.chapters.map((c) =>
                  c.id === chapterId
                    ? { ...c, scenes: remainingScenes }
                    : c,
                ),
              }
            : book,
        ),
        selectedSceneId: newSelectedSceneId,
        selectedCharacterId: null,
      };
    });
  }

  function selectChapter(chapterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  function selectScene(chapterId: string, sceneId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: chapterId,
      selectedSceneId: sceneId,
      selectedCharacterId: null,
    }));
  }

  function createCharacter() {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const newCharacter: Character = {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        notes: "",
        photoUrl: "",
      };
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, characters: [...book.characters, newCharacter] }
            : book,
        ),
        selectedCharacterId: newCharacter.id,
        selectedChapterId: null,
        selectedSceneId: null,
      };
    });
  }

  function updateCharacter(
    characterId: string,
    fields: Partial<
      Pick<Character, "name" | "description" | "notes" | "photoUrl">
    >,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                characters: book.characters.map((character) =>
                  character.id === characterId
                    ? { ...character, ...fields }
                    : character,
                ),
              }
            : book,
        ),
      };
    });
  }

  function deleteCharacter(characterId: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                characters: book.characters.filter(
                  (character) => character.id !== characterId,
                ),
              }
            : book,
        ),
      };
    });
  }

  function selectCharacter(characterId: string) {
    setWorkspace((previous) => ({
      ...previous,
      selectedCharacterId: characterId,
      selectedChapterId: null,
      selectedSceneId: null,
    }));
  }

  function createIdea() {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const newIdea: Idea = {
        id: crypto.randomUUID(),
        text: "",
        createdAt: new Date().toISOString(),
      };
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, ideas: [...book.ideas, newIdea] }
            : book,
        ),
      };
    });
  }

  function updateIdea(ideaId: string, text: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                ideas: book.ideas.map((idea) =>
                  idea.id === ideaId ? { ...idea, text } : idea,
                ),
              }
            : book,
        ),
      };
    });
  }

  function deleteIdea(ideaId: string) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                ideas: book.ideas.filter((idea) => idea.id !== ideaId),
              }
            : book,
        ),
      };
    });
  }

  // Sprint-20-Step-04: accepts a StructureProposal from Co-author, creating
  // real Chapter/Scene domain objects. `selectedKeys` is a Set of strings
  // like "0" (chapter) or "0-1" (scene 1 of chapter 0). See ADR-0010.
  function acceptStructureProposal(
    proposal: {
      chapters: Array<{
        title: string;
        subtitle?: string;
        scenes: Array<{ title: string; description: string }>;
      }>;
    },
    selectedKeys: Set<string>,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;

      const newChapters: Chapter[] = [];
      proposal.chapters.forEach((propChapter, ci) => {
        if (!selectedKeys.has(String(ci))) return;
        const selectedScenes = propChapter.scenes.filter((_, si) =>
          selectedKeys.has(`${ci}-${si}`),
        );
        newChapters.push({
          id: crypto.randomUUID(),
          title: propChapter.title,
          subtitle: propChapter.subtitle ?? "",
          scenes:
            selectedScenes.length > 0
              ? selectedScenes.map((s) => ({
                  id: crypto.randomUUID(),
                  title: s.title,
                  text: "",
                }))
              : [{ id: crypto.randomUUID(), title: "Scene 1", text: "" }],
        });
      });

      if (newChapters.length === 0) return previous;

      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? { ...book, chapters: [...book.chapters, ...newChapters] }
            : book,
        ),
      };
    });
  }

  // Sprint-11-Step-01: replaces the previous zero-argument `selectBook()`
  // (Sprint 10 Step 04 — "deselect chapter/scene/character, return to the
  // current book's overview"). That was a naming collision, not the same
  // operation — switching the active book and returning to the current
  // book's overview are two different actions and always needed separate
  // names. This `selectBook` switches which book is active; the restored
  // "return to overview" behavior lives in `deselectAll()` below.
  function selectBook(bookId: string) {
    setWorkspace((previous) => ({
      ...previous,
      activeBookId: bookId,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  // Restores the Sprint-10-Step-04 "return to book overview" behavior,
  // lost when selectBook() was repurposed in Sprint-11-Step-01 to mean
  // "switch active book" instead. Deliberately does not touch
  // activeBookId — only clears the chapter/scene/character selection
  // within the currently active book.
  function deselectAll() {
    setWorkspace((previous) => ({
      ...previous,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
    }));
  }

  function selectAssistantMode(mode: Workspace["selectedAssistantMode"]) {
    setWorkspace((previous) => ({
      ...previous,
      selectedAssistantMode: mode,
    }));
  }

  // Sprint-13-Step-04: appends to the active dialog (last element of the
  // role's thread array) by default — see createThread() below for how
  // "active" is defined for Critic/Reader (multiple threads) vs Co-author/
  // Editor (always threads[0], the array's only and therefore also last
  // element). Sprint-14-Step-01: generalized to target a specific thread
  // by id (`threadId`) — needed once Reader can have several simultaneously
  // visible/addressable instances (Step 02's UI), not just the last one.
  // Omitting `threadId` preserves Co-author/Editor/Critic's Sprint 13
  // behavior unchanged (targets the last thread).
  function appendMessage(
    mode: "coauthor" | "editor" | "critic" | "reader",
    message: ChatMessage,
    threadId?: string,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const threads = activeBook.assistantThreads[mode];
      const targetId = threadId ?? threads.at(-1)?.id;
      const updatedThreads = threads.map((thread) =>
        thread.id === targetId
          ? { ...thread, messages: [...thread.messages, message] }
          : thread,
      );
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                assistantThreads: {
                  ...book.assistantThreads,
                  [mode]: updatedThreads,
                },
              }
            : book,
        ),
      };
    });
  }

  // Adds a new dialog at the end of the role's thread array, which (by the
  // "active = last element" rule above) immediately becomes active.
  // Sprint-14-Step-01: accepts an optional name/persona (for Reader's named
  // instances, Step 02's UI) instead of always auto-generating "Диалог N" —
  // omitting `options` preserves the Sprint 13 behavior unchanged.
  function createThread(
    mode: "coauthor" | "editor" | "critic" | "reader",
    options?: { name?: string; persona?: string },
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const threads = activeBook.assistantThreads[mode];
      const nextNumber = threads.length + 1;
      const newThread: AssistantThread = {
        id: crypto.randomUUID(),
        name: options?.name ?? `Диалог ${nextNumber}`,
        messages: [],
        ...(options?.persona ? { persona: options.persona } : {}),
      };
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                assistantThreads: {
                  ...book.assistantThreads,
                  [mode]: [...threads, newThread],
                },
              }
            : book,
        ),
      };
    });
  }

  // Sprint-14-Step-01: rename an existing thread (e.g. a Reader instance
  // after creation) — immutable, same find-and-map pattern as everywhere
  // else in this file.
  function renameThread(
    mode: "coauthor" | "editor" | "critic" | "reader",
    threadId: string,
    name: string,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const threads = activeBook.assistantThreads[mode];
      const updatedThreads = threads.map((thread) =>
        thread.id === threadId ? { ...thread, name } : thread,
      );
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                assistantThreads: {
                  ...book.assistantThreads,
                  [mode]: updatedThreads,
                },
              }
            : book,
        ),
      };
    });
  }

  // Sprint-14-Step-01: delete a thread — refuses to delete the last
  // remaining thread for a role (every role always has at least one
  // thread, the same invariant normalizeBook() already maintains for
  // pre-existing/migrated data).
  function deleteThread(
    mode: "coauthor" | "editor" | "critic" | "reader",
    threadId: string,
  ) {
    setWorkspace((previous) => {
      const activeBook = previous.books.find(
        (book) => book.id === previous.activeBookId,
      );
      if (!activeBook) return previous;
      const threads = activeBook.assistantThreads[mode];
      if (threads.length <= 1) return previous;
      const updatedThreads = threads.filter((thread) => thread.id !== threadId);
      return {
        ...previous,
        books: previous.books.map((book) =>
          book.id === activeBook.id
            ? {
                ...book,
                assistantThreads: {
                  ...book.assistantThreads,
                  [mode]: updatedThreads,
                },
              }
            : book,
        ),
      };
    });
  }

  // Sprint-29-Step-05: Series CRUD methods. All API errors throw exceptions
  // (ADR-0012 Decision 5 — no silent fallback).

  // Helper: call Series API endpoint and throw on error.
  async function callSeriesApi(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: unknown,
  ): Promise<unknown> {
    try {
      const options: RequestInit = { method };
      if (body !== undefined) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
      }
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(
          `Series API error: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Series API returned ok: false");
      }
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Series API error";
      throw new Error(message);
    }
  }

  function createSeries(title: string, description?: string): Series {
    if (!title || title.trim().length === 0) {
      throw new Error("Series title cannot be empty");
    }

    const newSeries: Series = {
      id: crypto.randomUUID(),
      userId: "local-user", // Placeholder for local state (will be replaced with auth user ID)
      title: title.trim(),
      description: description?.trim() ?? "",
      order: workspace.series.length, // order = next index
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Call API asynchronously — fire and persist locally first, then sync
    // to API. On error, throw.
    void (async () => {
      try {
        await callSeriesApi("/api/series", "POST", {
          id: newSeries.id,
          title: newSeries.title,
          description: newSeries.description,
          order: newSeries.order,
          createdAt: newSeries.createdAt,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create series";
        console.error("createSeries API error:", message);
        throw error;
      }
    })();

    setWorkspace((previous) => ({
      ...previous,
      series: [...previous.series, newSeries],
    }));

    return newSeries;
  }

  function updateSeries(
    seriesId: string,
    title: string,
    description: string,
  ): Series {
    const series = workspace.series.find((s) => s.id === seriesId);
    if (!series) {
      throw new Error(`Series with id ${seriesId} not found`);
    }

    if (!title || title.trim().length === 0) {
      throw new Error("Series title cannot be empty");
    }

    const updatedSeries: Series = {
      ...series,
      title: title.trim(),
      description: description.trim(),
    };

    void (async () => {
      try {
        await callSeriesApi("/api/series", "PUT", {
          id: updatedSeries.id,
          title: updatedSeries.title,
          description: updatedSeries.description,
          order: updatedSeries.order,
          createdAt: updatedSeries.createdAt,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update series";
        console.error("updateSeries API error:", message);
        throw error;
      }
    })();

    setWorkspace((previous) => ({
      ...previous,
      series: previous.series.map((s) =>
        s.id === seriesId ? updatedSeries : s,
      ),
    }));

    return updatedSeries;
  }

  function deleteSeries(seriesId: string): void {
    const series = workspace.series.find((s) => s.id === seriesId);
    if (!series) {
      throw new Error(`Series with id ${seriesId} not found`);
    }

    void (async () => {
      try {
        await callSeriesApi("/api/series", "DELETE", { id: seriesId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete series";
        console.error("deleteSeries API error:", message);
        throw error;
      }
    })();

    setWorkspace((previous) => {
      // Get books that belong to this series to soft-delete them
      const booksInSeries = previous.books.filter((b) => b.seriesId === seriesId);

      // Add books to trash
      if (booksInSeries.length > 0) {
        setDeletedBooks((prev) => [
          ...booksInSeries.map((b) => ({ ...b, deletedAt: new Date() })),
          ...prev,
        ]);
      }

      // Remove the series and delete books that belonged to it
      const updatedBooks = previous.books.filter((b) => b.seriesId !== seriesId);
      return {
        ...previous,
        series: previous.series.filter((s) => s.id !== seriesId),
        books: updatedBooks,
      };
    });
  }

  function addBookToSeries(bookId: string, seriesId: string): Book {
    const book = workspace.books.find((b) => b.id === bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    const series = workspace.series.find((s) => s.id === seriesId);
    if (!series) {
      throw new Error(`Series with id ${seriesId} not found`);
    }

    const updatedBook: Book = { ...book, seriesId };

    // Update local state — useEffect will automatically save to backend
    setWorkspace((previous) => ({
      ...previous,
      books: previous.books.map((b) => (b.id === bookId ? updatedBook : b)),
    }));

    return updatedBook;
  }

  function removeBookFromSeries(bookId: string): Book {
    const book = workspace.books.find((b) => b.id === bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    const updatedBook: Book = { ...book, seriesId: undefined };

    // Update local state — useEffect will automatically save to backend
    setWorkspace((previous) => ({
      ...previous,
      books: previous.books.map((b) => (b.id === bookId ? updatedBook : b)),
    }));

    return updatedBook;
  }

  // Sprint-33-Step-07: move book to a different series (or to "Без серии" if
  // targetSeriesId is null). Used by drag-drop UI in Sidebar.
  function moveBookToSeries(
    bookId: string,
    targetSeriesId: string | null,
  ): Book {
    const book = workspace.books.find((b) => b.id === bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    // Check if target series exists (if not null)
    if (targetSeriesId !== null) {
      const series = workspace.series.find((s) => s.id === targetSeriesId);
      if (!series) {
        throw new Error(`Series with id ${targetSeriesId} not found`);
      }
    }

    // Don't move if already in the target series
    if (book.seriesId === targetSeriesId) {
      return book;
    }

    const updatedBook: Book = {
      ...book,
      seriesId: targetSeriesId ?? undefined,
    };

    // Update local state — useEffect will automatically save to backend
    setWorkspace((previous) => ({
      ...previous,
      books: previous.books.map((b) => (b.id === bookId ? updatedBook : b)),
    }));

    return updatedBook;
  }

  // Derived convenience value for Step 05's UI — the active dialog per role
  // of the active book (last element of each role's thread array).
  const activeThreads = activeBook
    ? {
        coauthor: activeBook.assistantThreads.coauthor.at(-1),
        editor: activeBook.assistantThreads.editor.at(-1),
        critic: activeBook.assistantThreads.critic.at(-1),
        reader: activeBook.assistantThreads.reader.at(-1),
      }
    : undefined;

  return {
    workspace,
    activeBook,
    books,
    deletedBooks,
    series,
    activeBookId,
    chapters,
    selectedChapterId,
    selectedSceneId,
    selectedChapter,
    selectedScene,
    characters,
    selectedCharacterId,
    selectedCharacter,
    ideas: activeBook?.ideas ?? [],
    createBook,
    updateBook,
    deleteBook,
    restoreBook,
    permanentlyDeleteBook,
    createChapter,
    updateChapter,
    deleteChapter,
    createScene,
    updateSceneText,
    updateSceneTitle,
    deleteScene,
    selectChapter,
    selectScene,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    createIdea,
    updateIdea,
    deleteIdea,
    acceptStructureProposal,
    selectBook,
    deselectAll,
    selectAssistantMode,
    appendMessage,
    createThread,
    renameThread,
    deleteThread,
    activeThreads,
    syncWarning,
    createSeries,
    updateSeries,
    deleteSeries,
    addBookToSeries,
    removeBookFromSeries,
    moveBookToSeries,
  };
}
