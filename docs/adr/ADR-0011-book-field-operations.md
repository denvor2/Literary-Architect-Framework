# ADR-0011: Book Field AI Suggestions

- **Status:** Accepted, revised Sprint 25
- **Date:** 2026-07-10
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0003](ADR-0003-technology-stack-strategy.md) (Technology Stack),
  [ADR-0008](ADR-0008-coauthor-expert-contract.md) (Co-author Expert Contract)

**2026-07-11 annotation:** Sprint 25 Step 04 extended `book_field_suggestion` with an optional,
Title-only `requestType` (typed quick-request buttons) — see "Amendment (Sprint 25): typed
quick-request buttons for Title" below. The Decision text above is unchanged and remains
accurate whenever `requestType` is absent.

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

## Amendment (Sprint 25): typed quick-request buttons for Title

This section is an addition, not a rewrite — the Decision text above remains the accurate
description of `book_field_suggestion` for every field whenever `requestType` is absent, and
for genre/premise/shortAnnotation/fullAnnotation regardless (they do not send `requestType`).

- **What changed:** the Product Owner wanted, for the Title field specifically, several typed
  quick-request buttons instead of one generic "AI" button — named examples: "подобрать
  аналоги" (comparables), "мозговой штурм" (brainstorm), "проверить на уникальность"
  (uniqueness). `book_field_suggestion`'s payload gains an optional
  `requestType?: BookFieldRequestType` (`"comparables" | "brainstorm" | "uniqueness"`), forwarded
  unchanged through `aiBus.ts` to `/api/book-field`, which picks a typed prompt variant
  (`TITLE_REQUEST_PROMPTS`) instead of the field's single generic prompt when it is present and
  the field is `title`. Source: `apps/studio/src/ai/operations.ts`, `apps/studio/src/ai/aiBus.ts`,
  `apps/studio/src/app/api/book-field/route.ts`.
- **Backward compatible by construction:** `requestType` is optional; its absence (every field
  other than Title, and any future caller that doesn't pass it) reproduces exactly the
  pre-Sprint-25 request/response and prompt selection. No existing caller changes.
- **Response shape is deliberately unchanged:** `{ suggestion, explanation }` stays the contract
  for all three request types, including "проверить на уникальность" — that request's
  `suggestion` field carries an analytical verdict string (e.g. "Похоже на существующие книги:
  ..." or "Выглядит достаточно уникальным"), not a title candidate. Introducing a variable
  response shape per request type was explicitly rejected as unnecessary complexity for this
  step.
- **UI consequence, not a contract change:** because "проверить на уникальность" produces a
  verdict rather than a value for the field, its suggestion card in `EditorArea.tsx` omits the
  "Принять" (Accept) button — only "Понятно" (dismiss). "Подобрать аналоги" and "мозговой штурм"
  keep the existing Принять/Отклонить card, and Принять still writes `suggestion` into
  `Book.title` via the same `updateBook()` path as before.
- **Scope of this amendment:** Title only. Genre/premise/shortAnnotation/fullAnnotation keep
  their single generic "AI" button, unchanged — extending typed quick-requests to those fields is
  explicitly left for a later step, not implied by this one.
- **Live-verified** (Sprint-25-Step-04): real `npm run dev` + real Claude responses confirmed the
  three request types produce substantively different content for the same book (not just that
  the request was accepted), that the uniqueness card genuinely has no Accept button, and that
  the existing generic-button fields (genre/premise/annotations) regressed none of their prior
  behavior.
