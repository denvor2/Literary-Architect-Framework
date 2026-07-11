// Global workspace search (Sprint-25-Step-06).
//
// Pure functions only — no React/DOM, no I/O. Client-side, case-insensitive
// substring search over Workspace data already held in memory
// (useWorkspaceController.ts already returns books/chapters/characters/
// ideas — no new API route, no search index, no fuzzy-matching library).
//
// Scope (see the Step Card's "Разобранные технические развилки", points
// 3-6):
//   - Book.title is matched across every book in the workspace — the one
//     part of search not scoped to the active book (it is how the author
//     switches books from the results list).
//   - Chapter.title/subtitle, Scene.title/text, Character.name/description/
//     notes, and Idea.text are matched only within the *active* book. This
//     module does not know about `activeBookId` at all — the caller
//     (page.tsx, via useWorkspaceController's already-active-book-scoped
//     `chapters`/`characters`/`ideas`) is responsible for that narrowing.
//   - `mainTextOnly` (the "искать только в основном тексте" checkbox,
//     unchecked by default) narrows the whole search down to Scene.text
//     matches of the active book only — no Book.title, Chapter.title/
//     subtitle, Scene.title, Character.*, or Idea.* results at all while
//     it is on.

import type { Book, Chapter, Character, Idea } from "@/domain/model";

// Below this many non-whitespace characters, the caller (Header.tsx) keeps
// the results dropdown closed — this module still refuses to compute
// anything for a too-short query, so a caller can't accidentally show
// stale/irrelevant results either.
export const SEARCH_MIN_QUERY_LENGTH = 2;

export type BookSearchMatch = {
  readonly bookId: string;
  readonly title: string;
};

// One row per chapter or per scene, not one row per matched field — a
// chapter-level match (title/subtitle) has no `sceneId`; a scene-level
// match (title or text) always carries both `chapterId` and `sceneId`.
export type ChapterOrSceneSearchMatch = {
  readonly chapterId: string;
  readonly sceneId?: string;
  readonly label: string;
  readonly snippet?: string;
};

export type CharacterSearchMatch = {
  readonly characterId: string;
  readonly label: string;
  readonly snippet?: string;
};

export type IdeaSearchMatch = {
  readonly ideaId: string;
  readonly snippet: string;
};

export type SearchResults = {
  readonly books: readonly BookSearchMatch[];
  readonly chaptersAndScenes: readonly ChapterOrSceneSearchMatch[];
  readonly characters: readonly CharacterSearchMatch[];
  readonly ideas: readonly IdeaSearchMatch[];
};

const EMPTY_RESULTS: SearchResults = {
  books: [],
  chaptersAndScenes: [],
  characters: [],
  ideas: [],
};

function includesQuery(value: string, normalizedQuery: string): boolean {
  return value.toLowerCase().includes(normalizedQuery);
}

// Simple ~40-character window around the first match — no highlighting/
// fuzzy library (Step Card Rules: "без библиотек подсветки"). Only used for
// the longer free-text fields (Scene.text, Character.description/notes,
// Idea.text); short fields (titles/names) are shown in full by the caller.
function makeSnippet(
  value: string,
  normalizedQuery: string,
  radius = 18,
): string {
  const index = value.toLowerCase().indexOf(normalizedQuery);
  if (index === -1) return value.slice(0, 40);
  const start = Math.max(0, index - radius);
  const end = Math.min(value.length, index + normalizedQuery.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < value.length ? "…" : "";
  return `${prefix}${value.slice(start, end)}${suffix}`;
}

export function searchWorkspace(params: {
  readonly query: string;
  readonly books: readonly Book[];
  readonly chapters: readonly Chapter[];
  readonly characters: readonly Character[];
  readonly ideas: readonly Idea[];
  readonly mainTextOnly?: boolean;
}): SearchResults {
  const {
    query,
    books,
    chapters,
    characters,
    ideas,
    mainTextOnly = false,
  } = params;

  const trimmed = query.trim();
  if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) return EMPTY_RESULTS;
  const normalizedQuery = trimmed.toLowerCase();

  const bookMatches: BookSearchMatch[] = mainTextOnly
    ? []
    : books
        .filter((book) => includesQuery(book.title, normalizedQuery))
        .map((book) => ({ bookId: book.id, title: book.title }));

  const chaptersAndScenes: ChapterOrSceneSearchMatch[] = [];
  for (const chapter of chapters) {
    if (!mainTextOnly) {
      const chapterMatches =
        includesQuery(chapter.title, normalizedQuery) ||
        includesQuery(chapter.subtitle, normalizedQuery);
      if (chapterMatches) {
        chaptersAndScenes.push({
          chapterId: chapter.id,
          label: chapter.title,
        });
      }
    }
    for (const scene of chapter.scenes) {
      const textMatches = includesQuery(scene.text, normalizedQuery);
      const titleMatches =
        !mainTextOnly && includesQuery(scene.title, normalizedQuery);
      if (textMatches || titleMatches) {
        chaptersAndScenes.push({
          chapterId: chapter.id,
          sceneId: scene.id,
          label: scene.title,
          snippet: textMatches
            ? makeSnippet(scene.text, normalizedQuery)
            : undefined,
        });
      }
    }
  }

  const characterMatches: CharacterSearchMatch[] = [];
  if (!mainTextOnly) {
    for (const character of characters) {
      const nameMatches = includesQuery(character.name, normalizedQuery);
      const descriptionMatches = includesQuery(
        character.description,
        normalizedQuery,
      );
      const notesMatches = includesQuery(character.notes, normalizedQuery);
      if (nameMatches || descriptionMatches || notesMatches) {
        characterMatches.push({
          characterId: character.id,
          label: character.name,
          snippet: descriptionMatches
            ? makeSnippet(character.description, normalizedQuery)
            : notesMatches
              ? makeSnippet(character.notes, normalizedQuery)
              : undefined,
        });
      }
    }
  }

  const ideaMatches: IdeaSearchMatch[] = [];
  if (!mainTextOnly) {
    for (const idea of ideas) {
      if (includesQuery(idea.text, normalizedQuery)) {
        ideaMatches.push({
          ideaId: idea.id,
          snippet: makeSnippet(idea.text, normalizedQuery),
        });
      }
    }
  }

  return {
    books: bookMatches,
    chaptersAndScenes,
    characters: characterMatches,
    ideas: ideaMatches,
  };
}
