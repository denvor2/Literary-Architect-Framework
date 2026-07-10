// Workspace persistence — Sprint 06 Step 07 (extraction only).
//
// Moved out of page.tsx unchanged: same key, same JSON shape, same
// fallback-to-empty behavior on missing/corrupted data. No versioning, no
// validation, no async API, no repository — a straight lift of the
// existing logic.

import type {
  AssistantThread,
  AssistantThreads,
  Book,
  Chapter,
  Character,
} from "@/domain/model";
import type { Workspace } from "@/domain/workspace";

const STORAGE_KEY = "literary-studio-workspace";

const EMPTY_WORKSPACE: Workspace = {
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
  selectedAssistantMode: "editor",
};

function emptyThread(): AssistantThread {
  return { id: "1", name: "Диалог 1", messages: [] };
}

// Per-role default, not just whole-object default: a book saved with only
// some roles' threads present (e.g. coauthor has real messages, the other
// three roles didn't exist yet) must keep the ones that exist and default
// only the missing ones.
function normalizeAssistantThreads(
  threads: Partial<AssistantThreads> | undefined,
): AssistantThreads {
  return {
    coauthor: threads?.coauthor ?? [emptyThread()],
    editor: threads?.editor ?? [emptyThread()],
    critic: threads?.critic ?? [emptyThread()],
    reader: threads?.reader ?? [emptyThread()],
  };
}

// Fix-Book-Fields-Undefined-Systemic: centralizes "what to do about a
// missing Book field" in one place. Every field of Book gets a default
// here — if a future field is added to Book and this function isn't
// updated, the defect shows up immediately and uniformly (a missing field
// here), not as a hard-to-explain crash in some random component months
// later. Third occurrence of this exact class of bug (Workspace-level
// characters, Chapter.subtitle, now Book fields) — this is why it's a
// shared function instead of another one-off fix at the point of use.
function normalizeBook(book: Partial<Book>): Book {
  return {
    id: book.id ?? "",
    title: book.title ?? "",
    genre: book.genre ?? "",
    language: book.language ?? "",
    premise: book.premise ?? "",
    shortAnnotation: book.shortAnnotation ?? "",
    fullAnnotation: book.fullAnnotation ?? "",
    tags: book.tags ?? [],
    chapters: book.chapters ?? [],
    characters: book.characters ?? [],
    assistantThreads: normalizeAssistantThreads(book.assistantThreads),
    ideas: book.ideas ?? [],
  };
}

// Sprint-11-Step-01: migrates the single-book Workspace shape (Sprint 05
// through Sprint 10 — one `book` object plus top-level `chapters`/
// `characters`) into the multi-book shape (`books: Book[]`, `activeBookId`).
// This is the first real data-shape migration in the project — read
// carefully before changing.
function migrateIfNeeded(parsed: unknown): Workspace {
  const data = parsed as Record<string, unknown>;

  // New format already — nothing to migrate, but each book still passes
  // through normalizeBook() in case it's missing fields added to Book
  // after it was saved (see Fix-Book-Fields-Undefined-Systemic above).
  if (Array.isArray(data.books)) {
    return {
      ...EMPTY_WORKSPACE,
      ...(data as Partial<Workspace>),
      books: data.books.map((book) => normalizeBook(book as Partial<Book>)),
    };
  }

  // Old format: single `book` (without id/chapters/characters — those were
  // separate top-level Workspace fields) + top-level chapters/characters.
  if (data.book) {
    const oldBook = data.book as Partial<Book>;
    const migratedBook = normalizeBook({
      id: "1",
      title: oldBook.title,
      genre: oldBook.genre,
      language: oldBook.language,
      premise: oldBook.premise,
      shortAnnotation: oldBook.shortAnnotation,
      fullAnnotation: oldBook.fullAnnotation,
      tags: oldBook.tags,
      chapters: data.chapters as readonly Chapter[] | undefined,
      characters: data.characters as readonly Character[] | undefined,
    });
    return {
      books: [migratedBook],
      activeBookId: migratedBook.id,
      selectedChapterId: (data.selectedChapterId as string | null) ?? null,
      selectedSceneId: (data.selectedSceneId as string | null) ?? null,
      selectedCharacterId: (data.selectedCharacterId as string | null) ?? null,
      selectedAssistantMode:
        (data.selectedAssistantMode as Workspace["selectedAssistantMode"]) ??
        "editor",
    };
  }

  // No book at all (fresh/empty old data) — start clean in new format.
  return EMPTY_WORKSPACE;
}

export function loadWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WORKSPACE;
    return migrateIfNeeded(JSON.parse(raw));
  } catch {
    return EMPTY_WORKSPACE;
  }
}

export function saveWorkspace(workspace: Workspace): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}
