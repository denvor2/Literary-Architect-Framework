# ADR-0007: Multi-Book Workspace

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Product Owner, Architect, Programmer (Executor)
- **Relates to:** [ADR-0004](ADR-0004-expert-contract-specification.md),
  [ADR-0005](ADR-0005-critic-expert-contract.md),
  [ADR-0006](ADR-0006-reader-expert-contract.md) (same ratification method — read from
  already-shipped code, file+line citations, not designed in the abstract)

## Context

Through Sprint 10, `Workspace` held exactly one book: `{ book: Book | null, chapters:
Chapter[], characters: Character[], selectedChapterId, selectedSceneId, selectedCharacterId }`
— `chapters` and `characters` were separate top-level Workspace fields, not part of `Book`
itself. `createBook()` unconditionally replaced the entire `Workspace`, discarding whatever book
was there before.

**This was a real, materialized risk, not a hypothetical one: the Product Owner lost their
first book by creating a second one, before this Sprint's migration existed.** That incident is
the reason Sprint 11 was prioritized above the previously-planned Co-author work — it is
recorded here plainly, not softened or omitted.

Sprint 11 (Steps 01–04, plus two emergency fixes) rewrote the domain model, storage, and UI to
support multiple books. This ADR ratifies that work the same way ADR-0004/0005/0006 ratified
the Expert Contract — from the code as shipped.

## Decision

### Workspace shape

`Workspace` is now:

```typescript
export type Workspace = {
  books: readonly Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
};
```

Source: `apps/studio/src/domain/workspace.ts`.

`Book` became a self-contained container — `chapters` and `characters` moved from Workspace
fields into `Book` itself:

```typescript
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
};
```

Source: `apps/studio/src/domain/model.ts`. `shortAnnotation`/`fullAnnotation`/`tags` were added
in Sprint-11-Step-04, alongside making Genre/Language consistently `<select>`-driven
(`GENRES`/`LANGUAGES`, single source of truth in `NewBookDialog.tsx`, imported by
`EditorArea.tsx` — not duplicated).

**Selection state (`selectedChapterId`/`selectedSceneId`/`selectedCharacterId`) stays on
`Workspace`, not inside `Book`.** This is a deliberate simplification, not an oversight:
switching the active book resets the chapter/scene/character selection — selection is not
remembered per-book. Every mutation function in `useWorkspaceController.ts` (`createChapter`,
`updateChapter`, `createScene`, `updateSceneText`, `updateSceneTitle`, `createCharacter`,
`updateCharacter`, `deleteCharacter`) follows the same rewritten pattern: find the active `Book`
via `previous.activeBookId`, apply the change to that Book's `chapters`/`characters`, write the
updated Book back into `books` via an immutable `.map()` — the same shape of change every one of
these functions previously made directly against `previous.chapters`/`previous.characters`.
Source: `apps/studio/src/workspace/useWorkspaceController.ts`.

`createBook()` now **appends** to `books` and makes the new book active, instead of replacing
`Workspace` outright:

```typescript
return {
  ...previous,
  books: [...previous.books, newBook],
  activeBookId: newBook.id,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
};
```

Source: `apps/studio/src/workspace/useWorkspaceController.ts` (`createBook`).

### Data migration

`workspaceStorage.ts`'s `loadWorkspace()` detects the old shape (a top-level `book` field on the
parsed data, with no `books` array) and wraps it into a single `Book` with `id: "1"`, pulling
the old top-level `chapters`/`characters` into that `Book`:

Source: `apps/studio/src/storage/workspaceStorage.ts` (`migrateIfNeeded`).

**This migration protects data saved after it shipped. It does not — and cannot — recover the
book that was already lost before it existed.** That loss is a permanent, acknowledged fact
about this project's history, not a risk this ADR is claiming to have retroactively eliminated.

### `normalizeBook()` — a recurring class of bug, addressed once, centrally

Across this Sprint, the exact same defect shape recurred three times as `Book`'s fields grew:
Workspace-level `characters`/`selectedCharacterId` missing on old data (Sprint 10), then
`Chapter.subtitle` missing (Sprint 10), then `Book.tags`/`shortAnnotation`/`fullAnnotation`
missing (Sprint 11 — this one caused a real crash, `book.tags.join(...)` on `undefined`, for
books saved in the *new* `books[]` format but before Sprint-11-Step-04 added those fields).

`normalizeBook()` centralizes the defaulting of every `Book` field in one place, applied in
*both* `migrateIfNeeded()` branches (the old-format migration and the already-new-format pass-
through):

```typescript
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
  };
}
```

Source: `apps/studio/src/storage/workspaceStorage.ts`.

**This is recorded as mandatory future practice, not just a bug fix:** when a field is added to
`Book` (and, by the same reasoning, likely eventually to `Chapter`/`Character`/`Scene`), the
Step Card that adds it must update `normalizeBook()` (or an equivalent) in the same step — not
defer it to "whenever it crashes somewhere." This ADR's own Review Trigger (below) names this
explicitly so it isn't forgotten by the time it matters again.

### Process lesson: the `selectBook()` naming collision

`useWorkspaceController.ts` already had a zero-argument `selectBook()` before this Sprint
(Sprint 10 Step 04 — "deselect chapter/scene/character, return to the current book's overview").
Sprint-11-Step-01's Step Card, without checking, asked for a *new* `selectBook(bookId: string)`
("switch active book") under the same name — a different operation entirely. Following the Step
Card literally replaced the old function, silently losing the "return to overview" behavior
until the Architect caught it in review and it was restored under a new name, `deselectAll()`.

**Recorded as a process lesson, not a code fact:** before a Step Card prescribes a new function
with a given name, the Architect authoring it should check whether that name is already in use
for something else. The Programmer did the right thing here — followed the literal instruction,
then explicitly flagged the resulting behavior loss rather than silently deciding either to keep
the old behavior or accept the loss.

## Consequences

**Now recorded as fact:**

- `Workspace` supports an arbitrary number of books; creating a new book no longer destroys any
  existing one.
- `Book` is a self-contained container for its own `chapters` and `characters` — the domain
  hierarchy `Workspace → Book → Chapter → Scene` / `Book → Character` is now fully nested, not
  split across two levels.
- `normalizeBook()` establishes a reusable pattern for defending against missing fields on
  entities loaded from `localStorage` — expected to generalize to other entities as they grow
  new fields.
- Selection state is intentionally *not* per-book — switching books always resets chapter/scene/
  character selection.

**Still not decided by this ADR:**

- Whether selection state should eventually become per-book (see Review Trigger below).
- Book Series (multiple books sharing Characters/context) — captured as an idea in
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` Section 8, not designed.
- Collapsible/unified book-level view (all chapters/scenes visible at once, collapsible per
  level) — captured in the same vision document, Section 2's amendment, explicitly "an idea,
  under discussion," not a decision.
- Trash/Archive for deleted entities — vision document Section 9, not designed.

## Review Trigger

Revisit (amend or supersede) this ADR when any of the following occurs:

- Selection state (`selectedChapterId`/`selectedSceneId`/`selectedCharacterId`) needs to be
  remembered per-book rather than reset on every book switch.
- A new field is added to `Book` (or `Chapter`/`Character`/`Scene`) without a corresponding
  update to `normalizeBook()` (or its equivalent for that entity) in the same Step Card — this
  ADR's own recorded practice would have been violated.
- Book Series or Collapsible View (vision document Sections 8 and 2) move from idea to design.
