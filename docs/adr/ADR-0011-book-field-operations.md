# ADR-0011: Book Field AI Suggestions

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack),
  [ADR-0008](ADR-0008-coauthor-expert-contract.md) (Co-author Expert Contract)

## Context

AI Experts currently operate on scene text (Editor, Critic, Reader) or whole-book structure
(Co-author structure proposal). Writers also need help with Book metadata — title, genre,
premise, annotations. These are short, domain-specific fields where AI can suggest values
based on the book's existing content and context. This is a new AI surface, distinct from
existing Experts.

## Decision

### Operation Type

New AI Bus operation: `book_field_suggestion`.

```typescript
{
  type: "book_field_suggestion";
  payload: {
    fieldName: BookFieldName;
    currentValue: string;
    bookContext: Book;
  };
}
```

`BookFieldName` is a string literal union of supported fields:

```typescript
type BookFieldName =
  | "title"
  | "genre"
  | "premise"
  | "shortAnnotation"
  | "fullAnnotation";
```

`tags` is excluded — it's an array, and tag suggestions warrant a different UX (multi-value
selector, not a single suggestion). Revisit separately if needed.

### Endpoint

New route: `/api/book-field` — not an extension of an existing Expert, because this is a
utility operation (suggest a metadata value), not a literary role (edit/critique/draft).

Request:

```typescript
{
  fieldName: BookFieldName;
  currentValue: string;
  bookContext: Book;
}
```

Response:

```typescript
{ ok: true; suggestion: string; explanation: string }
// or
{ ok: false; error: string }
```

`suggestion` is the AI-proposed value for the field. `explanation` is a brief justification
(1-2 sentences) — shown in the UI so the writer understands why this value was suggested.

### Prompt

The system prompt is field-aware: it receives the field name and current value, plus the full
book context, and returns a JSON `{ suggestion, explanation }` object. The prompt is stored as
a `FIELD_PROMPTS` constant in the route file, keyed by `BookFieldName`.

### AI Bus

`aiBus.execute()` dispatches `book_field_suggestion` to `/api/book-field` with the payload
forwarded directly. Response is serialized into `AIResponse.text` as JSON (same pattern as
`critic_review` and `coauthor_propose_structure`).

### UI Flow

1. In the book requisites block (UnifiedBookView), each supported field gets a small
   "AI" button next to its label.
2. Clicking the button sends a `book_field_suggestion` operation via AI Bus.
3. While loading, the button shows a spinner.
4. On success, a suggestion card appears below the field: the suggested value, the
   explanation, and two buttons — "Принять" (accept) and "Отклонить" (dismiss).
5. "Принять" updates the field value (via `updateBook()` in workspace controller).
6. "Отклонить" dismisses the suggestion card.
7. Only one suggestion can be active per field at a time — requesting a new one dismisses
   the previous.

### Backward Compatibility

Entirely new functionality — no existing behavior changes. All new code, no modifications to
existing routes or operations.

## Consequences

- New endpoint, new operation type, new UI components — contained change, no impact on
  existing Experts.
- `BookFieldName` is a shared type between the route, AI Bus, and UI — prevents typos and
  enables exhaustive checking.
- The suggestion is ephemeral (not persisted until accepted) — same pattern as Co-author
  structure proposal (Sprint 20).

## Known Gaps

- `tags` (array field) is not supported — needs a different UX (multi-suggestion or
  tag-specific prompt). Revisit when writers ask for it.
- `language` is not supported — it's a technical setting, not a creative field.
- No "regenerate" button — if the suggestion is poor, the user must click "AI" again.
  Acceptable at this stage; revisit if writers want iterative refinement.
- The explanation is always shown — no toggle to hide it. Low priority.

## Review Trigger

Revisit when:
- Writers need tag suggestions.
- Writers want iterative refinement (multiple rounds of suggestions for one field).
- The suggestion quality is inconsistent across fields (consider per-field prompt tuning).
