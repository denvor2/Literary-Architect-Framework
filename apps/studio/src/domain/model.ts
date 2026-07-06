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

export type AssistantThread = {
  readonly id: string;
  readonly name: string;
  readonly messages: readonly ChatMessage[];
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
