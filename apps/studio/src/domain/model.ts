// Domain Model Layer (Sprint 06, Step 01).
//
// Pure types only. No UI logic, no storage logic, no imports from React,
// Next.js, or any component/API module. These shapes match exactly what the
// UI already produced and consumed before this sprint (see docs/reports/
// SPRINT-05.md) — this is a type-level extraction, not a data-shape change.
//
// Fields are `readonly` to express the "immutable structures" rule. Existing
// call sites already update state by producing new objects/arrays (spread,
// `.map`), never by mutating in place, so this does not change behavior.

export type Scene = {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly deletedAt?: Date; // Sprint-36: soft delete timestamp for trash
};

export type Chapter = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly scenes: readonly Scene[];
  readonly deletedAt?: Date; // Sprint-36: soft delete timestamp for trash
};

export type Idea = {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
  readonly deletedAt?: Date; // Sprint-36: soft delete timestamp for trash
};

// Sprint-34-Step-03: BookStatus enum for story bible tracking.
export type BookStatus = "outline" | "draft" | "editing" | "beta" | "published";

export type Book = {
  readonly id: string;
  readonly title: string;
  readonly genre: string;
  readonly language: string;
  readonly premise: string;
  readonly shortAnnotation: string;
  readonly fullAnnotation: string;
  readonly tags: readonly string[];
  readonly chapters: readonly Chapter[];
  readonly characters: readonly Character[];
  readonly assistantThreads: AssistantThreads;
  readonly ideas: readonly Idea[];
  readonly seriesId?: string; // Sprint-29-Step-05: optional reference to Series
  readonly deletedAt?: Date; // Sprint-33-Step-01: soft delete timestamp

  // Story Bible fields (Sprint-34-Step-03)
  readonly workingTitle?: string; // Working/draft title
  readonly targetAudience?: string; // e.g., "Adult", "YA", "Teen"
  readonly genreArray?: readonly string[]; // Array of genres (separate from genre: string for UI compatibility)
  readonly estimatedWordCount?: number; // Estimated word count for this book
  readonly estimatedChapters?: number; // Planned chapter count
  readonly storyBibleStatus?: BookStatus; // outline | draft | editing | beta | published
  readonly mainPlotlines?: readonly string[]; // Array of main plotlines
  readonly principle?: string; // e.g., "Contrast. Chapters constantly switch POV."
  readonly escalation?: string; // e.g., "Sticks → Dolphins → Xenosys → Bears"
  readonly themes?: readonly string[]; // Array of themes
  readonly bookConstraints?: readonly string[]; // Array of constraints (what NOT to do)
  readonly notes?: string; // Internal notes
  readonly publishedDate?: Date; // Publication date
  readonly isbn?: string; // ISBN for published books
};

export type Character = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly notes: string;
  readonly photoUrl: string;
  readonly deletedAt?: Date; // Sprint-36: soft delete timestamp for trash
};

export type ChatMessage = {
  readonly role: "user" | "assistant";
  readonly content: string;
};

// Sprint-14-Step-01: `persona` is meaningful only for Reader's named
// instances (e.g. "молодой читатель" vs "придирчивый читатель") — the
// other three roles never set it. Kept on the shared shape rather than a
// separate "Reader Instance" type, since a named Reader instance is
// otherwise exactly a thread (name + message history).
export type AssistantThread = {
  readonly id: string;
  readonly name: string;
  readonly messages: readonly ChatMessage[];
  readonly persona?: string;
};

// One data shape for all four Product Roles (Sprint-13-Step-01) — Co-author/
// Editor keep a single continuous thread, Critic/Reader may hold several
// named ones ("Новый читатель" etc.). The difference is in how the UI uses
// this per role, not in the shape itself (see Step 04, not yet built).
export type AssistantThreads = {
  readonly coauthor: readonly AssistantThread[];
  readonly editor: readonly AssistantThread[];
  readonly critic: readonly AssistantThread[];
  readonly reader: readonly AssistantThread[];
};

// Sprint-29-Step-05: Series domain model for grouping books.
// Persistent data stored in Postgres via /api/series endpoints (Step-04).
// Sprint-34-Step-03: Extended with Story Bible fields for series-level planning.
export type SeriesStatus = "outline" | "in_progress" | "complete" | "published";

export type Series = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly createdAt: string; // ISO string
  readonly userId: string;
  readonly updatedAt: string; // ISO string

  // Story Bible fields (Sprint-34-Step-03)
  readonly targetAudience?: string; // e.g., "Adult", "YA", "Teen"
  readonly genre?: readonly string[]; // Array of genres for entire series
  readonly estimatedTotalWordCount?: number; // Estimated total word count for entire series
  readonly status?: SeriesStatus; // outline | in_progress | complete | published
  readonly decisions?: string; // High-level creative decisions
  readonly throughlineElements?: readonly string[]; // Array of throughline elements
  readonly seriesConstraints?: readonly string[]; // Array of series-level constraints
  readonly notes?: string; // Internal notes
  readonly firstPublishedDate?: Date; // First publication date
  readonly author?: string; // Author name (if different from User)
};

// Sprint-34-Step-03: Helper functions for domain model

/**
 * Normalize Series data — apply defaults for missing fields
 * Ensures all optional fields are properly typed and null-safe
 */
export function normalizeSeries(data: unknown): Series {
  const typed = data as Record<string, unknown>;
  return {
    id: (typed.id as string) ?? "",
    userId: (typed.userId as string) ?? "",
    title: (typed.title as string) ?? "",
    description: (typed.description as string) ?? "",
    order: (typed.order as number) ?? 0,
    createdAt: typed.createdAt
      ? typeof typed.createdAt === "string"
        ? typed.createdAt
        : typed.createdAt instanceof Date
          ? typed.createdAt.toISOString()
          : new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: typed.updatedAt
      ? typeof typed.updatedAt === "string"
        ? typed.updatedAt
        : typed.updatedAt instanceof Date
          ? typed.updatedAt.toISOString()
          : new Date().toISOString()
      : new Date().toISOString(),
    targetAudience: (typed.targetAudience as string | undefined) ?? undefined,
    genre: typed.genre && Array.isArray(typed.genre) ? typed.genre : undefined,
    estimatedTotalWordCount:
      typeof typed.estimatedTotalWordCount === "number"
        ? typed.estimatedTotalWordCount
        : undefined,
    status: (typed.status as SeriesStatus | undefined) ?? undefined,
    decisions: (typed.decisions as string | undefined) ?? undefined,
    throughlineElements:
      typed.throughlineElements && Array.isArray(typed.throughlineElements)
        ? typed.throughlineElements
        : undefined,
    seriesConstraints:
      typed.seriesConstraints && Array.isArray(typed.seriesConstraints)
        ? typed.seriesConstraints
        : undefined,
    notes: (typed.notes as string | undefined) ?? undefined,
    firstPublishedDate:
      (typed.firstPublishedDate as Date | undefined) ?? undefined,
    author: (typed.author as string | undefined) ?? undefined,
  };
}

/**
 * Normalize Book data — apply defaults for missing fields
 * Ensures all optional fields are properly typed and null-safe
 */
export function normalizeBook(data: unknown): Book {
  const typed = data as Record<string, unknown>;
  return {
    id: (typed.id as string) ?? "",
    title: (typed.title as string) ?? "",
    genre: (typed.genre as string) ?? "",
    language: (typed.language as string) ?? "",
    premise: (typed.premise as string) ?? "",
    shortAnnotation: (typed.shortAnnotation as string) ?? "",
    fullAnnotation: (typed.fullAnnotation as string) ?? "",
    tags: Array.isArray(typed.tags) ? (typed.tags as readonly string[]) : [],
    chapters: Array.isArray(typed.chapters)
      ? (typed.chapters as readonly Chapter[])
      : [],
    characters: Array.isArray(typed.characters)
      ? (typed.characters as readonly Character[])
      : [],
    assistantThreads: (typed.assistantThreads as AssistantThreads) ?? {
      coauthor: [],
      editor: [],
      critic: [],
      reader: [],
    },
    ideas: Array.isArray(typed.ideas) ? (typed.ideas as readonly Idea[]) : [],
    seriesId: (typed.seriesId as string | undefined) ?? undefined,
    deletedAt: (typed.deletedAt as Date | undefined) ?? undefined,
    workingTitle: (typed.workingTitle as string | undefined) ?? undefined,
    targetAudience: (typed.targetAudience as string | undefined) ?? undefined,
    genreArray:
      typed.genreArray && Array.isArray(typed.genreArray)
        ? typed.genreArray
        : undefined,
    estimatedWordCount:
      typeof typed.estimatedWordCount === "number"
        ? typed.estimatedWordCount
        : undefined,
    estimatedChapters:
      typeof typed.estimatedChapters === "number"
        ? typed.estimatedChapters
        : undefined,
    storyBibleStatus:
      (typed.storyBibleStatus as BookStatus | undefined) ?? undefined,
    mainPlotlines:
      typed.mainPlotlines && Array.isArray(typed.mainPlotlines)
        ? typed.mainPlotlines
        : undefined,
    principle: (typed.principle as string | undefined) ?? undefined,
    escalation: (typed.escalation as string | undefined) ?? undefined,
    themes:
      typed.themes && Array.isArray(typed.themes) ? typed.themes : undefined,
    bookConstraints:
      typed.bookConstraints && Array.isArray(typed.bookConstraints)
        ? typed.bookConstraints
        : undefined,
    notes: (typed.notes as string | undefined) ?? undefined,
    publishedDate: (typed.publishedDate as Date | undefined) ?? undefined,
    isbn: (typed.isbn as string | undefined) ?? undefined,
  };
}
