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
};

export type Chapter = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly scenes: readonly Scene[];
};

export type Idea = {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
};

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
};

export type Character = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly notes: string;
  readonly photoUrl: string;
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
export type Series = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly createdAt: string; // ISO string
};
