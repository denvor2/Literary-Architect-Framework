# ADR-0008: Co-author Expert Contract

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Product Owner, Architect, Programmer (Executor)
- **Relates to:** [ADR-0004](ADR-0004-expert-contract-specification.md) (Line Editor, revised by
  this ADR's companion section below), [ADR-0005](ADR-0005-critic-expert-contract.md) (Critic),
  [ADR-0006](ADR-0006-reader-expert-contract.md) (Reader) — same ratification method: read from
  already-shipped code, file+line citations, not designed in the abstract.

## Context

Sprint 12 (Steps 01–04, plus one emergency fix) built and shipped Co-author: a backend route, a
fourth `AIOperation` variant, real AI Bus dispatch, and UI wiring. Unlike every prior Expert,
Co-author is genuinely generative — it writes or continues manuscript text rather than assessing
(Critic/Reader) or polishing existing text (Line Editor). This ADR ratifies that Expert's
contract the same way ADR-0004/0005/0006 did, and separately revises ADR-0004 now that Line
Editor's own contract changed (see "Revision to ADR-0004", below).

**Co-author was, since `docs/product/DOMAIN_MODEL.md`'s Open Questions, the one Product Role
with no grounded mapping to any AI Expert at all** — every other named Expert in ADR-0002 was
editorial/review-oriented, none performed original drafting. This ADR resolves that gap for the
first time.

## Decision

### Request/Response Schema (the Expert boundary: `/api/coauthor`)

- **Request:** `POST /api/coauthor` with JSON body `{ currentText: string, bookContext: object
  }`. Source: `apps/studio/src/app/api/coauthor/route.ts:9-12`.
- **`currentText` may be empty** — unlike every prior Expert's `text` field, an empty
  `currentText` is valid input, meaning "write a new scene draft from scratch" rather than
  "continue this text." Validation: `typeof currentText !== "string"` (not the falsy/empty
  check other Experts use) → `{ ok: false, error: "currentText must be a string (may be
  empty)." }`, HTTP 400. Source: `route.ts:14-19`.
- **`bookContext` is required, not optional** — the whole active `Book` (all chapters, scenes,
  characters, and metadata), not a fragment. Validation: `typeof bookContext !== "object" ||
  bookContext === null` → `{ ok: false, error: "bookContext is required and must be an object."
  }`, HTTP 400. Source: `route.ts:21-26`.
- **Success response:** `{ ok: true, result: string }` — the same shape as Line Editor/Reader,
  where `result` is the generated/continued scene text. Source: `route.ts:40`.
- **Failure response:** `{ ok: false, error: string }`, HTTP 500, same `error instanceof Error ?
  error.message : "Unknown error"` pattern as every other Expert. Source: `route.ts:41-47`.
- **Model and prompt are fixed, not parameterized** — same principle as every other Expert:
  model `"claude-sonnet-5"`, `max_tokens: 1024`, one hardcoded system prompt instructing the
  model to act as a generative co-author (not critic/editor), use the full book context, and
  continue `currentText` if non-empty or draft fresh if empty. Source: `route.ts:32-36`.
  Responds in Russian by default, same principle already established for Reader (Sprint 9).
  Source: `route.ts:35`.

### Co-author is the first genuinely generative Expert

Every prior Expert either assesses (`critic_review`, `reader_reaction` — produce a Review, no
"Заменить текст") or polishes existing text without expanding it (`improve_text` — Line
Editor). Co-author is the first to produce new prose that did not exist in the input — a
Revision, matching the Domain Model's Review/Revision distinction
(`docs/product/DOMAIN_MODEL.md`, terms 9–10). Its UI wiring reuses the same generic preview
branch as Editor (Original/Improved + "Заменить текст"/"Оставить как есть") precisely because
both produce Revisions — no new UI state was needed. Source:
`apps/studio/src/components/EditorArea.tsx`'s `handleCoauthor` (Sprint-12-Step-04), which sets
`improvedText`/`status: "preview"` exactly like `handleImprove` does.

### Co-author is the first Expert to see the whole Book

Every prior Expert (Line Editor, Critic, Reader) received only the current scene's text (or a
selected fragment of it). Co-author receives the entire active `Book` — `title`, `genre`,
`language`, `premise`, `shortAnnotation`, `fullAnnotation`, `tags`, all `chapters` (with their
`scenes`), and all `characters` — as `bookContext`, unchanged from the shape `Book` already has
in `apps/studio/src/domain/model.ts` (no simplified/stripped-down type was introduced; the
backend does not validate the structure strictly, and the `id` fields present are harmless).

This is a deliberate, and now fixed, per-Expert context scope — not an oversight to reconcile
later:

| Expert      | Context received                          | Why                                          |
| ----------- | ------------------------------------------ | --------------------------------------------- |
| Line Editor | scene text; optionally whole `Book` (Sprint 12) | polish only — book context is for consistency, never expansion |
| Critic      | scene text only                             | assesses the scene as written, on its own terms |
| Reader      | scene text only                             | reacts as a reader would, without author-level knowledge |
| Co-author   | whole `Book`, always                        | cannot draft/continue consistently without plot, characters, and established style |

Critic/Reader remain scene/selection-scoped by design and are explicitly unaffected by this
ADR.

### Position in the AI Bus v5 Chain

- **`AIOperation`** gained its fourth variant: `{ type: "coauthor_draft"; payload: {
  currentText: string; bookContext: Book } }` — the first variant with a payload shape that
  isn't `{ text, sceneId?, chapterId? }`. Source: `apps/studio/src/ai/operations.ts`
  (`coauthor_draft` variant, Sprint-12-Step-03).
- **`aiBus.execute()`**'s fourth branch: for `coauthor_draft`, calls `/api/coauthor` with `{
  currentText, bookContext }`, and — because the response is already string-shaped — assigns
  `data.result` to `resultText` directly, the same no-stringify/no-TODO pattern already
  established for `reader_reaction`. Source: `apps/studio/src/ai/aiBus.ts` (the `coauthor_draft`
  branch, Sprint-12-Step-03).
- Adding this fourth variant required a structural (not logical) change to `aiBus.execute()`:
  the single top-level `const { text } = operation.payload` destructure (valid when every
  variant shared the same payload shape) no longer type-checks once one variant lacks `text` —
  it was moved into each branch individually. Recorded here because it is a direct consequence
  of Co-author's genuinely different payload shape, not an unrelated refactor.
- The consuming UI (`EditorArea.tsx`) calls `coauthor_draft` with the whole scene's text
  (`text`, not a selection) as `currentText` — Co-author writes/continues the scene as a whole,
  unlike Critic/Reader which can react to a selected fragment.

### Revision to ADR-0004 (Line Editor / Editor)

ADR-0004 ratified Line Editor's contract as accepting only `{ text: string }`. Sprint-12-Step-02
extended `/api/line-editor` to accept an **optional** `bookContext` field, forwarded by
`improve_text` (Sprint-12-Step-03) and now sent by Editor's UI handler (Sprint-12-Step-04):

- `bookContext` is optional — its absence produces byte-identical request/response behavior to
  before this change, preserving ADR-0004's original contract as a strict subset.
- **Editor's task did not change.** `bookContext` is used only for consistency (character
  names, established plot facts) — the system prompt explicitly instructs the model never to
  use it to rewrite or expand `text` beyond what was given. Editor remains a polish operation,
  not a generative one; it did not become Co-author.
- Live verification (Sprint-12-Step-02, repeated in Sprint-12-Step-04 via the UI wiring)
  confirmed both properties hold: an unusual character name present in `bookContext` is
  preserved verbatim in the output, and the output does not expand beyond the input text's
  scope even though the full book precedes it in the prompt.

This is **ratified as of Sprint 12** — an amendment to ADR-0004's Decision, not a rewrite of it;
ADR-0004's original Request/Response Schema section describing the pre-Sprint-12 shape remains
accurate as a historical description of what shipped in Sprint 04–11.

### Product Role Mapping

- **Co-author (visible Product Role) → Co-author Expert (`/api/coauthor`) is now a direct,
  unambiguous 1:1 mapping** — resolving `docs/product/DOMAIN_MODEL.md`'s Open Question that had
  stood, unresolved, since the document's own creation: Co-author was the one Product Role with
  no grounded mapping to any AI Expert in ADR-0002's original list at all.
- **Editor remains mapped to the Line Editor Expert** — unchanged since ADR-0004, now
  additionally receiving `bookContext` (see Revision above), but the mapping itself (Editor →
  Line Editor) is not new.
- **Critic → Critic Expert and Reader → Reader Expert remain 1:1** (ADR-0005/0006),
  unaffected by this ADR.

## Known Gaps (recorded, not resolved by this ADR)

- The assistant-mode switcher UI (cards + responsive bottom list) and persisting the selected
  mode across sessions remain unconsolidated — captured in
  `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` as deferred to Sprint 13, alongside the chat
  mechanism (deliberately not split into two separate reworks of the same surface).
  Two real UI bugs were found and fixed during Sprint 12's browser testing: the assistant
  button's label not reflecting the selected mode (`Fix-Assistant-Button-Label`), then unified
  to a single "Спросить" label regardless of mode (`Fix-Assistant-Button-Label-Ask`) — both are
  UI polish, not part of this ADR's contract.
- Service-level UI copy (labels, framing text in `MODE_INFO`) remains in English — localization
  of Line Editor's/Critic's prompts and this remaining English UI copy is planned for Sprint 14,
  not addressed here.
- As with every prior Expert, `result`/`result.response.text` is not validated at runtime beyond
  being a string.

## Consequences

**Now recorded as fact:**

- The Expert Contract family now has four ratified members: three returning a single string
  (Line Editor, Reader, Co-author) and one returning a structured array (Critic) — Co-author is
  the first *generative* Expert and the first to receive the whole `Book` as context.
- AI Bus v5's dispatch mechanism is validated by a fourth real case, requiring (for the first
  time) a structural change to `aiBus.execute()`'s shared destructuring — future Experts with a
  differently-shaped payload should expect the same kind of adjustment, not treat the previous
  shared-`text`-destructure pattern as permanent.
- ADR-0004 is amended, not superseded — Line Editor's core contract (grammar/style polish of
  `text`) is unchanged; only an optional, scope-limited context field was added.
- `docs/product/DOMAIN_MODEL.md`'s Open Question "Co-author has no grounded mapping to any
  existing AI Expert" is resolved.

**Still not decided by this ADR:**

- Consolidating the assistant-mode switcher UI and persisting the selected mode — Sprint 13.
- The chat mechanism for Co-author (multi-turn collaboration, not one-shot draft generation) —
  Sprint 13, alongside the switcher consolidation.
- Localizing remaining English UI copy and other Experts' prompts — Sprint 14.

## Review Trigger

Revisit (amend or supersede) this ADR when any of the following occurs:

- A fifth `AIOperation` variant is added — check whether the two-payload-shape pattern recorded
  here (the original `{ text, sceneId?, chapterId? }` shape vs. Co-author's `{ currentText,
  bookContext }`) still describes the field, or a third shape emerges.
- The assistant-mode switcher is consolidated (Sprint 13) — this ADR's Known Gaps section
  would need updating.
- A chat/multi-turn mechanism is added for Co-author — this ADR describes only one-shot draft
  generation with no memory between calls.
- `bookContext`'s optionality on `improve_text` is removed (i.e., Editor is made to always
  require book context) — the Revision to ADR-0004 section above assumes it stays optional.
