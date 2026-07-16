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
export function normalizeSeries(data: any): Series {
  return {
    id: data.id ?? "",
    userId: data.userId ?? "",
    title: data.title ?? "",
    description: data.description ?? "",
    order: data.order ?? 0,
    createdAt: data.createdAt
      ? typeof data.createdAt === "string"
        ? data.createdAt
        : data.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: data.updatedAt
      ? typeof data.updatedAt === "string"
        ? data.updatedAt
        : data.updatedAt.toISOString()
      : new Date().toISOString(),
    targetAudience: data.targetAudience ?? undefined,
    genre: data.genre && Array.isArray(data.genre) ? data.genre : undefined,
    estimatedTotalWordCount:
      typeof data.estimatedTotalWordCount === "number"
        ? data.estimatedTotalWordCount
        : undefined,
    status: data.status ?? undefined,
    decisions: data.decisions ?? undefined,
    throughlineElements:
      data.throughlineElements && Array.isArray(data.throughlineElements)
        ? data.throughlineElements
        : undefined,
    seriesConstraints:
      data.seriesConstraints && Array.isArray(data.seriesConstraints)
        ? data.seriesConstraints
        : undefined,
    notes: data.notes ?? undefined,
    firstPublishedDate: data.firstPublishedDate ?? undefined,
    author: data.author ?? undefined,
  };
}

/**
 * Normalize Book data — apply defaults for missing fields
 * Ensures all optional fields are properly typed and null-safe
 */
export function normalizeBook(data: any): Book {
  return {
    id: data.id ?? "",
    title: data.title ?? "",
    genre: data.genre ?? "",
    language: data.language ?? "",
    premise: data.premise ?? "",
    shortAnnotation: data.shortAnnotation ?? "",
    fullAnnotation: data.fullAnnotation ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    chapters: Array.isArray(data.chapters) ? data.chapters : [],
    characters: Array.isArray(data.characters) ? data.characters : [],
    assistantThreads: data.assistantThreads ?? {
      coauthor: [],
      editor: [],
      critic: [],
      reader: [],
    },
    ideas: Array.isArray(data.ideas) ? data.ideas : [],
    seriesId: data.seriesId ?? undefined,
    deletedAt: data.deletedAt ?? undefined,
    workingTitle: data.workingTitle ?? undefined,
    targetAudience: data.targetAudience ?? undefined,
    genreArray:
      data.genreArray && Array.isArray(data.genreArray)
        ? data.genreArray
        : undefined,
    estimatedWordCount:
      typeof data.estimatedWordCount === "number"
        ? data.estimatedWordCount
        : undefined,
    estimatedChapters:
      typeof data.estimatedChapters === "number"
        ? data.estimatedChapters
        : undefined,
    storyBibleStatus: data.storyBibleStatus ?? undefined,
    mainPlotlines:
      data.mainPlotlines && Array.isArray(data.mainPlotlines)
        ? data.mainPlotlines
        : undefined,
    principle: data.principle ?? undefined,
    escalation: data.escalation ?? undefined,
    themes:
      data.themes && Array.isArray(data.themes) ? data.themes : undefined,
    bookConstraints:
      data.bookConstraints && Array.isArray(data.bookConstraints)
        ? data.bookConstraints
        : undefined,
    notes: data.notes ?? undefined,
    publishedDate: data.publishedDate ?? undefined,
    isbn: data.isbn ?? undefined,
  };
}
