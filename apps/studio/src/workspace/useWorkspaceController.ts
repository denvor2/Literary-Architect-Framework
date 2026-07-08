"use client";

import { useEffect, useState } from "react";
import type {
  AssistantThread,
  Book,
  Chapter,
  ChatMessage,
  Character,
} from "@/domain/model";
import type { Workspace } from "@/domain/workspace";
import { loadWorkspace, saveWorkspace } from "@/storage/workspaceStorage";

// Used only as the pre-hydration initial state (see the restore effect
// below) — must match server render, so it cannot itself call
// loadWorkspace(), which depends on window.localStorage.
const EMPTY_WORKSPACE: Workspace = {
  books: [],
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
  const {
    books,
    activeBookId,
    selectedChapterId,
    selectedSceneId,
    selectedCharacterId,
  } = workspace;

  // Restore the previous workspace once, on mount. This intentionally
  // synchronizes React state from an external system (localStorage), which
  // cannot be read during server rendering — an effect is the correct,
  // hydration-safe place for it, even though the linter's general-purpose
  // heuristic flags the first setState call inside an effect body.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkspace(loadWorkspace());
    setIsLoaded(true);
  }, []);

  // Persist the whole workspace under one key whenever it changes — but only
  // after the initial restore above has run, so we never overwrite existing
  // saved data with the default empty state during the first render.
  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspace(workspace);
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
    >,
  ) {
    setWorkspace((previous) => {
      const nextNumber = previous.books.length + 1;
      const newBook: Book = {
        id: String(nextNumber),
        ...newBookData,
        chapters: [
          {
            id: "1",
            title: "Chapter 1",
            subtitle: "",
            scenes: [{ id: "1", title: "Scene 1", text: "" }],
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
          coauthor: [{ id: "1", name: "Диалог 1", messages: [] }],
          editor: [{ id: "1", name: "Диалог 1", messages: [] }],
          critic: [{ id: "1", name: "Диалог 1", messages: [] }],
          reader: [{ id: "1", name: "Диалог 1", messages: [] }],
        },
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
        id: String(nextNumber),
        title: `Chapter ${nextNumber}`,
        subtitle: "",
        scenes: [{ id: "1", title: "Scene 1", text: "" }],
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
      const newSceneId = String(nextNumber);
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
      const nextNumber = activeBook.characters.length + 1;
      const newCharacter: Character = {
        id: String(nextNumber),
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
        id: String(nextNumber),
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
    activeBookId,
    chapters,
    selectedChapterId,
    selectedSceneId,
    selectedChapter,
    selectedScene,
    characters,
    selectedCharacterId,
    selectedCharacter,
    createBook,
    updateBook,
    createChapter,
    updateChapter,
    createScene,
    updateSceneText,
    updateSceneTitle,
    selectChapter,
    selectScene,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    selectBook,
    deselectAll,
    selectAssistantMode,
    appendMessage,
    createThread,
    renameThread,
    deleteThread,
    activeThreads,
  };
}
