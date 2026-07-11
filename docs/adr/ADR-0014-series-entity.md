# ADR-0014: Series Entity — Book Collections with Shared Context

- **Status:** Pending Decision (awaiting Product Owner response to open questions)
- **Date:** 2026-07-12
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack Strategy — Persistence: PostgreSQL, Prisma),
  [ADR-0007](ADR-0007-multi-book-workspace.md) (Multi-Book Workspace),
  [ADR-0012](ADR-0012-persistence-migration.md) (Persistence Migration — Single-user stopgap),
  [ROADMAP_18-27.md](../../project/ROADMAP_18-27.md) (Sprint 29 — Book Series entry)

## Context

Product Owner added Book Series (collections of books sharing characters and world-building) to
ROADMAP_18-27.md as Sprint 29 with low confidence ("Requires domain model extension"). A Code
reading of the current codebase shows:

- Book has no Series references today
- Workspace (domain/model.ts) contains no Series type
- No Prisma table or repository code exists for this feature
- No API routes exist for Series CRUD

Following the precedent of ADR-0012 (Persistence Migration) and ADR-0013 (Assistant Settings),
this ADR freezes the architectural shape of Series before implementation Step Cards (Step 02
onward) are executed. This approach catches genuine product decisions (which require Product Owner
judgment) separately from implementation details (which the Programmer can resolve).

## Decision

### Series Entity Definition

A **Series** is a collection of 2+ books united by shared thematic, character, or world-building
context. Examples: "Harry Potter" (7 books), "Dune" (6+ books), "A Song of Ice and Fire" (ongoing
series).

### Data Model

```
Series {
  id: string (CUID, globally unique, same as Book.id pattern)
  userId: string (owner — same user-scoped model as Book)
  title: string (e.g. "Harry Potter", "Dune")
  description: string (optional, e.g. "Wizarding world epic fantasy")
  createdAt: DateTime (auto-set on creation)
  updatedAt: DateTime (auto-set on update)
}

Book {
  // ...existing fields...
  seriesId?: string | null (optional reference to Series, many-to-one)
}
```

### Key Design Decisions

#### 1. Optional Series Membership

`Book.seriesId` is nullable — not every book belongs to a series. A writer may have standalone
books in the same workspace as series.

#### 2. User Ownership

Series are tied to `userId`, just like Books. Each user sees/edits only their own series. Until
Sprint 30 introduces multi-user roles, a user can only add their own books to their own series.
This maintains consistency with the ADR-0012 single-user stopgap model.

#### 3. No Cascade Delete

Deleting a Series does NOT delete the books in it — they retain their `seriesId` reference (or,
if handled carefully in migration, it is set to `NULL`). Deleting a Book from the database does
not affect any Series — the orphaned reference is handled as-is (implementation Step-02 handles
exact Prisma semantics; this ADR constrains it to SetNull, not Cascade).

#### 4. Ordering (Open Question for Product Owner)

**Should Series have an explicit `order: Int` field, or rely on `createdAt` for display order?**

- **Recommendation:** Add `order: Int`, defaulting to `0`, to allow future UI drag-reorder without
  migration. If never used, `createdAt` can still serve as a stable fallback sort.

### Domain Model (TypeScript)

Series is added to `domain/model.ts`:

```typescript
export type Series = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};
```

`Book` is extended with:

```typescript
export type Book = {
  // ...existing fields...
  readonly seriesId?: string | null;
};
```

`Workspace` is extended with:

```typescript
export type Workspace = {
  // ...existing fields...
  readonly series?: readonly Series[]; // optional, top-level array
};
```

### Series Placement in Workspace (Open Question for Product Owner)

**Should Series be a top-level array in Workspace (parallel to `books`), or embedded differently?**

- **Recommendation:** Top-level `series?: readonly Series[]`, alongside `books`, because:
  - Series is a container for books, not a property of a single book
  - UI tree (Sidebar) can render Series → Books hierarchy cleanly
  - Queries for "all books" and "all series" do not require each other
  - Matches the existing top-level structure pattern

If the Product Owner prefers a different structure (e.g., `Book.series` inline), this ADR is
revisited.

### Repository and API Contracts (Outline Only)

**Storage/Retrieval:**
- `loadSeriesForUser(userId)` — fetch all series owned by a user
- `saveSeriesToUser(userId, series, books)` — persist a series and its membership

**API endpoints (exact shape in Step-02):**
- `GET /api/series` — list all series for the current user
- `POST /api/series` — create a new series
- `PUT /api/series/{id}` — update series metadata (title, description, order)
- `DELETE /api/series/{id}` — delete a series (books are unaffected)
- `POST /api/series/{id}/add-book` — add a book to a series (optional convenience endpoint)
- `POST /api/series/{id}/remove-book` — remove a book from a series (optional convenience endpoint)

**Recommendation:** Mirror the Book CRUD pattern (whole-object updates via `PUT`), plus two
convenience endpoints for fast add/remove without reloading the entire series. Product Owner
confirms exact shape in Step-02.

### UI Outlines (Vision, Not Implementation)

- **NewSeriesDialog** — create a series with title and optional description
- **Series list in Sidebar** — expandable tree showing series and their books (similar to Books
  list, but hierarchical)
- **SeriesEditDialog** — rename, edit description, reorder
- **Drag-drop Books into Series (optional)** — Product Owner scope decision for Step-05 UI

## Open Questions for Product Owner (Blocker for Step-02)

**These three decisions must be confirmed before implementation Step Cards proceed:**

1. **Ordering field:** Add `order: Int` to Series for explicit UI reordering, or rely on
   `createdAt`?
   - Recommendation: Add `order`.

2. **Book-in-Series deletion behavior:** When a user deletes a Book that is in a Series:
   - **Option A:** Book is deleted; Series remains, with the book simply removed from its list
     (simpler, current default)
   - **Option B:** Show a warning ("This book is in a series") and require user confirmation
   - **Recommendation:** Option A, with explicit UI signaling if desired later

3. **Series hierarchy in Workspace:** Should Series be:
   - **Option A:** Top-level array (`workspace.series`, `workspace.books` both present)
   - **Option B:** Embedded differently (e.g., `workspace.books` contains series references inline)
   - **Recommendation:** Option A (clean separation, familiar pattern)

## Consequences

- Prisma schema will add a `Series` table plus a foreign-key column `seriesId` to `Book` (Step-02)
- `domain/model.ts` will introduce a new `Series` type and extend `Workspace` (Step-02)
- All four layers (Repository, API, Controller, UI) can be built independently on top of this
  foundation with certainty about data shape
- No breaking changes to existing Book structure — `seriesId` is optional
- Multi-book series are now architectural first-class citizens, not a special case

## Known Gaps / Triggers for Future ADRs

- **Full UI hierarchy (Series → Book → Chapter → Scene)** — not yet designed; scope for Step-05
  or later
- **Concurrent Series editing (what if two users edit the same Series simultaneously)** — Sprint
  30 (Multi-user) and beyond
- **Series export/import** — out of scope (see vision/roadmap, section 8)
- **Series search / filtering** — not designed; optional enhancement for future sprints
- **Series-level metadata (cover image, shared notes, shared characters)** — deferred pending
  working examples and Product Owner prioritization

## Stop Condition

Do NOT proceed with Step-02 (Prisma schema migration) until Product Owner explicitly confirms
answers to the three open questions above (ordering, deletion behavior, Workspace hierarchy). If
Product Owner's answer differs from the recommendations, this ADR is updated to reflect the
decision before Step-02 executes.
