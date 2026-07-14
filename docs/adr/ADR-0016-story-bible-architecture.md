# ADR-0016: Story Bible Architecture

**Status:** Proposed  
**Date:** 2026-07-14  
**Deciders:** Product Owner, Architect  
**Drivers:** User research ("Как писать в Literary Studio"), need for metadata scaffolding

---

## Problem

Currently, Literary Studio lacks a structured way to capture high-level creative decisions, constraints, and metadata about a Series and Book. Authors need to:

1. **Document story-level decisions** (why this story exists, core conflicts, themes)
2. **Enforce constraints** ("what NOT to do") to maintain consistency
3. **Organize metadata** (target audience, estimated word count, status)
4. **Separate Series-level from Book-level** information (some elements are shared across books in a series)

Without this structure, critical story information lives in scattered notes or not at all.

---

## Solution

Introduce a **Story Bible** layer to both `Series` and `Book` entities:

### 1. Data Model

#### Series-level Story Bible

```typescript
interface Series {
  // Existing fields
  id: string;
  userId: string;
  title: string;
  description: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;

  // NEW — Story Bible
  targetAudience?: string;              // "Adult", "YA", "Teen"
  genre?: string[];                     // ["Fantasy", "Sci-Fi", "Philosophy"]
  estimatedTotalWordCount?: number;     // Total for entire series
  status?: SeriesStatus;                // "outline" | "in-progress" | "complete" | "published"
  
  // High-level creative decisions
  decisions?: string;                   // "The series explores the emergence of new intelligence..."
  throughlineElements?: string[];       // ["WildMind", "Jordan", "philosophical questions"]
  
  // Constraints (what NOT to do for entire series)
  seriesConstraints?: string[];         // ["No absolute villains", "Each book expands world scale"]
  
  // Metadata
  notes?: string;                       // Internal notes
  firstPublishedDate?: Date;
  author?: string;                      // If different from User
}
```

#### Book-level Story Bible

```typescript
interface Book {
  // Existing fields
  id: string;
  userId: string;
  seriesId?: string;
  title: string;
  description: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;

  // NEW — Story Bible
  workingTitle?: string;                // "приквел" (working name)
  targetAudience?: string;              // Inherits from Series if omitted
  genre?: string[];                     // Inherits from Series if omitted
  estimatedWordCount?: number;          // This book only
  estimatedChapters?: number;           // Planned chapter count
  status?: BookStatus;                  // "outline" | "draft" | "editing" | "beta" | "published"
  
  // Book-specific creative decisions
  mainPlotlines?: string[];             // ["Jordan (WildMind)", "Professor zoologist", "UN Operative"]
  principle?: string;                   // "Contrast. Chapters constantly switch POV."
  escalation?: string;                  // "Sticks → Dolphins → Xenosys → Bears"
  themes?: string[];                    // ["What is consciousness?", "Should we destroy new intelligence?"]
  
  // Constraints (what NOT to do in this book)
  bookConstraints?: string[];           // ["Don't overuse scientific jargon", "Limited animal POV"]
  
  // Metadata
  notes?: string;                       // Internal notes
  publishedDate?: Date;
  isbn?: string;
}

type SeriesStatus = "outline" | "in-progress" | "complete" | "published";
type BookStatus = "outline" | "draft" | "editing" | "beta" | "published";
```

### 2. Hierarchy & Inheritance

**Series-level → Book-level:**

- If `Book.targetAudience` is `null` → inherit from `Series.targetAudience`
- If `Book.genre` is empty → inherit from `Series.genre`
- `Book.mainPlotlines` + `Series.throughlineElements` are displayed together (without duplicates)

**In UI (Sidebar):**
```
Characters (Series-level) 🔗
├── Jordan (inherited)
├── Professor (inherited)
└── Operative (book-local)

Characters (Book-level, this book)
```

### 3. Export to Markdown (Story Bible.md)

When user exports, generate `StoryBible.md`:

```markdown
# Terralia — Bible вселенной

## Серия

**Название:** Terralia

{{ series.description }}

## Решения

{{ series.decisions }}

## Сквозные элементы

{{ series.throughlineElements.map(e => `- ${e}`).join('\n') }}

## Ограничения

{{ series.seriesConstraints.map(c => `- ${c}`).join('\n') }}

---

## Terralia: Начало (Книга 1)

### Основные линии

{{ book.mainPlotlines.map(p => `- ${p}`).join('\n') }}

### Принцип

{{ book.principle }}

### Эскалация

{{ book.escalation }}

### Темы

{{ book.themes.map(t => `- ${t}`).join('\n') }}
```

### 4. UI — Gear Dialog with Tabs

Two dialogs (Series / Book), each with 4 tabs:

- **Tab 1: Основное** — title, description, audience, genre, status, counts
- **Tab 2: Story Bible** — decisions/plotlines/principle/escalation/themes
- **Tab 3: Ограничения** — constraints (what NOT to do)
- **Tab 4: Метаданные** — dates, ISBN, notes

[See UI mockup: Story Bible Dialog]

---

## Rationale

1. **Structured metadata** prevents critical information from being lost in prose
2. **Series vs Book hierarchy** matches author mental models (common elements, per-book variations)
3. **Constraints (❌ What NOT to do)** are underutilized but powerful — help authors stay consistent
4. **Export to Markdown** enables offline work, version control, and integration with other tools
5. **Tabs organize complexity** without overwhelming the UI

---

## Consequences

### Positive
- Authors can document high-level decisions once (Series) and reuse across books
- Export to Markdown opens integration with Git, external tools, research workflows
- Clear separation of Series-wide vs Book-specific metadata
- Constraints become actionable documentation

### Negative
- Adds ~16 fields to `Series` and `Book` models (schema migration required)
- UI becomes slightly more complex (4 tabs per dialog)
- Must handle inheritance logic in UI (show which fields are inherited vs overridden)

### Neutral
- Existing books/series without Story Bible data remain functional
- Fields are optional (`?:`) — no breaking changes

---

## Alternatives Considered

### A. Single unified Bible field
Store entire Story Bible as JSON blob in `Series.metadata` or `Book.metadata`.
- ❌ Loses type safety
- ❌ Harder to query, filter, or search individual constraints
- ✅ Simpler schema

### B. Separate StoryBible entity
Create `SeriesStoryBible` and `BookStoryBible` as standalone tables.
- ❌ Over-engineered (1:1 relationship, unnecessary normalization)
- ❌ More complex queries
- ✅ Cleaner separation of concerns

**→ Chose: Option C (inline fields)** — balance of type safety, simplicity, and queryability.

---

## Implementation

See Sprint 34 Step Cards:
- Step 01: ADR acceptance
- Step 02: Prisma schema migration
- Step 03: Domain Model + Repository
- Step 04: API endpoints (GET/PUT /api/series/{id}, /api/book/{id})
- Step 05: UI (Gear dialog with tabs)
- Step 06: Export to Markdown (Story Bible generation)

---

## References

- [Как писать в Literary Studio](docs/project/USER_GUIDE.md) — user research
- [Sprint 34 Roadmap](docs/project/ROADMAP.md)
- ADR-0012 (dual-mode storage)
- ADR-0014 (Series entity)

---

## Acceptance

- [ ] Product Owner: Confirms Story Bible structure matches user expectations
- [ ] Architect: Validates schema, export logic, UI hierarchy
- [ ] Programmer: Implements all 6 steps, validates against user guide
