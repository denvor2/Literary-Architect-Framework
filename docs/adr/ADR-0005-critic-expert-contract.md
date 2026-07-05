# ADR-0005: Critic Expert Contract

- **Status:** Accepted
- **Date:** 2026-07-05
- **Deciders:** Product Owner, Architect, Programmer (Executor)
- **Relates to:** [ADR-0004](ADR-0004-expert-contract-specification.md) (Expert Contract
  Specification — Line Editor)

## Context

[ADR-0004](ADR-0004-expert-contract-specification.md) ratified the Expert Contract from the
Line Editor — the only Expert that existed at the time — and explicitly left open whether a
second Expert would fit that contract unmodified or require extending it. Sprint 08 (Steps
01–04) built and shipped the second Expert, Critic: a backend route, a second `AIOperation`
variant, real dispatch in the AI Bus, and a UI panel. This ADR ratifies that Expert's contract
the same way ADR-0004 did — read from the already-running code, not designed in the abstract.

## Decision

### Request/Response Schema (the Expert boundary: `/api/critic`)

- **Request:** `POST /api/critic` with JSON body `{ text: string }` — **the same shape as
  Line Editor's request**, but with a different granularity expectation: `text` here is
  explicitly an arbitrary fragment, not necessarily a whole Scene. This is the first concrete
  example of an Expert operating on a sub-Scene span.
  Source: `apps/studio/src/app/api/critic/route.ts:7-9`.
- **Input validation:** identical to Line Editor — missing/non-string `text` →
  `{ ok: false, error: "No text provided." }`, HTTP 400.
  Source: `route.ts:11-16`.
- **Success response:** `{ ok: true, reviews: [{ category, severity, comment }] }` — this is
  where Critic's contract diverges from Line Editor's: the successful payload is a
  **structured array of findings**, not a single edited string.
  Source: `route.ts:45` (`return NextResponse.json({ ok: true, reviews });`); the shape of
  each entry is defined only by the system prompt, not by a TypeScript type on the backend —
  see Known Gaps, below.
- **Failure response:** `{ ok: false, error: string }`, HTTP 500 — **the same pattern as Line
  Editor** (`error instanceof Error ? error.message : "Unknown error"`), plus one Critic-
  specific failure mode: if the model's raw output does not parse as JSON even after stripping
  a possible markdown code fence, the route returns `{ ok: false, error: "Critic response was
  not valid JSON." }` — a failure mode Line Editor does not have, because Line Editor's output
  is used as free text and never parsed.
  Source: `route.ts:30-43` (parse attempt and its own catch), `route.ts:46-52` (outer
  catch, same pattern as Line Editor).
- **Model and prompt are fixed, not parameterized** — same principle as Line Editor: model
  `"claude-sonnet-5"`, `max_tokens: 1024`, one hardcoded system prompt instructing the model to
  return category/severity/comment entries as a raw JSON array only.
  Source: `route.ts:21-24`.

### Position in the AI Bus v5 Chain

- **`AIOperation`** gained its first-ever second variant: `{ type: "critic_review"; payload:
  { text, sceneId?, chapterId? } }` — same payload shape as `improve_text`.
  Source: `apps/studio/src/ai/operations.ts:17-24`.
- **`aiBus.execute()`** now genuinely branches on `operation.type` — this is the first real
  use of the dispatch ADR-0004 described as merely decorative at ratification time. For
  `critic_review`, it calls `/api/critic` with the same `{ text }` body shape, and — because
  `AIResponse`/`AppliedAIResponse` are still shaped around a single string result, not a
  structured payload — serializes `data.reviews` into `AIResponse.text` via
  `JSON.stringify`, marked with an explicit `// TODO Sprint-08-Step-03` comment.
  Source: `apps/studio/src/ai/aiBus.ts:38-51`.
- **This is a known, explicitly retained gap, not a decision made by this ADR.** `AIResponse`/
  `AppliedAIResponse` are not reworked here — the Step Card for this ADR explicitly asked that
  this remain a documented fact about current state, not something resolved now.
- The consuming UI (`EditorArea.tsx`) parses that JSON string back into an array at the call
  site (`JSON.parse(result.response.text)`), rather than the Bus handing back a typed
  structure.
  Source: `apps/studio/src/components/EditorArea.tsx:253-271` (`handleCritic`).

### Product Role Mapping

- **Critic (visible Product Role) → Critic Expert (`/api/critic`) is now a direct, unambiguous
  1:1 mapping** — the UI's Critic mode calls `critic_review` and nothing else.
  Source: `EditorArea.tsx:433` (`onClick={mode === "Critic" ? handleCritic : handleImprove}`).
  This is the first Product Role in this project with a resolved Expert mapping.
- **Co-author, Editor, and Reader remain unresolved** — all three still call `improve_text`
  (the Line Editor Expert) under different labels (see `MODE_INFO` in `EditorArea.tsx`). This
  ADR does not change that and does not attempt to resolve it — it is an explicitly separate,
  still-open point (see `docs/product/DOMAIN_MODEL.md`'s Open Questions, only partially
  updated by this ADR for Critic specifically).

## Known Gaps (recorded, not resolved by this ADR)

- `reviews` entries are not validated against any schema at either the backend or the Bus —
  `category`/`severity`/`comment` are whatever the model produced, optionally read by the UI
  (`EditorArea.tsx`'s `ReviewItem` type marks every field optional). Consistent with ADR-0004's
  own discovery-stage tolerance for the first Expert; the same tolerance is extended here.
- `AIResponse.text` carrying `JSON.stringify(reviews)` is a one-step, explicitly temporary
  representation — not a permanent part of this contract. A future ADR (or an amendment to
  this one) should record the typed `ReviewResult` shape once it exists in code.
- Co-author/Editor/Reader → Expert mapping remains unresolved, as stated above.

## Consequences

**Now recorded as fact:**

- The Expert Contract family now has two ratified members with one shared request shape
  (`{ text }`) and two different success-response shapes (a string vs. a structured array) —
  future Experts should be checked against both patterns, not assumed to always return text.
- AI Bus v5's dispatch mechanism is validated by a second real case, not just Line Editor —
  confirms the four-layer structure introduced in Sprint 06 extends without being redesigned.

**Still not decided by this ADR:**

- Whether `AIResponse`/`AppliedAIResponse` should be generalized to carry non-text payloads
  natively (e.g. a discriminated union) — deferred to whenever that TODO is actually resolved.
- The Co-author/Editor/Reader → Expert mapping.
- Any runtime validation of `reviews` entries.

## Review Trigger

Revisit (amend or supersede) this ADR when any of the following occurs:

- `AIResponse`/`AppliedAIResponse` are reworked to carry `reviews` as a typed structure
  instead of a JSON string — the Position in the AI Bus v5 Chain section would need updating.
- A third `AIOperation` variant is added — check whether the two-Expert pattern recorded here
  (one text-shaped, one array-shaped) still describes the field, or a third shape emerges.
- `reviews` entries gain runtime schema validation.
- Co-author, Editor, or Reader gets a concrete Expert mapping distinct from Line Editor.
