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

## Revision (Sprint 13 Step 02): `sceneText` rename + required `messages`

This section is an addition, not a rewrite — the Request/Response Schema section above remains
the accurate description of this Expert's Sprint 08 contract; this revision records what
changed since, the same "addition, not rewrite" convention [ADR-0004](ADR-0004-expert-contract-specification.md)
and [ADR-0006](ADR-0006-reader-expert-contract.md) already use for their own post-ratification
schema changes.

- **What changed:** the request body's `text` field was renamed `sceneText` (still required,
  same "missing/non-string" validation) and gained a required `messages: ChatMessage[]` array —
  the full client-managed conversation history, sent on every call. The server remains fully
  stateless (ADR-0004, unchanged) — nothing is kept between calls.
  Source: `apps/studio/src/app/api/critic/route.ts:34-35` (`sceneText`/`messages` read from
  `body`), `:43-48` (`sceneText` validation), `:50-72` (`messages` array + per-item `role`/
  `content` validation).
- **Critic did not gain `bookContext`, even optionally** — unlike Editor/Co-author, Critic (and
  Reader) stay outside ADR-0008's per-Expert context-scope table; this revision is scoped
  strictly to the conversation-history mechanism, not to widening what context Critic sees.
  Source: `route.ts`'s own header comment (lines 11-12): "Critic/Reader are outside the per-
  Expert context-scope table (ADR-0008) — no `bookContext` field exists here, not even
  optionally."
- **How `messages` reaches the model:** `sceneText` always anchors the conversation as the first
  user turn — `[{ role: "user", content: sceneText }, ...messages]` — the same pattern
  ADR-0006 records for Reader. Source: `route.ts:83-84`.
- **Response shape unaffected** — `{ ok: true, reviews }` on success, the same failure modes
  (including the Critic-specific "Critic response was not valid JSON." 500) as the original
  Decision section describes. This revision only changes the request side.
- **Follow-up questions stay inside the `reviews[]` structure**, rather than becoming free text:
  when the author asks a follow-up about a prior review, Critic answers with one entry
  (`category: "General"`, `severity` reflecting how important the answer is) instead of
  switching response shape mid-conversation — a design decision made at implementation time
  (not specified by the Sprint 13 Step Card itself), so the response contract recorded in the
  original Decision section holds even inside a multi-turn thread.
  Source: `CRITIC_BASE_PROMPT`, `route.ts:21` ("If the author asks a follow-up question about a
  previous review, still respond with an entry in this same schema... so your answer stays
  inside the array structure.").
- **Live-verified at the time, not re-verified by this documentation-only revision:**
  `docs/task-bus/queue/done/Sprint-13-Step-02-ARP.md`'s `/api/critic` section records a real
  server + real Claude 3-turn dialog that correctly stayed inside the `reviews[]` schema, plus
  validation failures for non-array `messages` and a malformed message item.
- **Corresponding `AIOperation` payload:** `critic_review`'s payload gained `sceneText`
  (renamed from `text`) and a required `messages: ChatMessage[]` — the same rename applied
  uniformly across all four operation variants in this same step.
  Source: `apps/studio/src/ai/operations.ts:49-56`.

## Revision (Sprint 15 Step 01): optional `bookLanguage`

This section is an addition, not a rewrite — it records a further, backward-compatible request
field added after the Sprint 13 revision above.

- **What changed:** the request body gained an optional `bookLanguage: string` field, defaulting
  to `"Russian"` when absent or not a string.
  Source: `route.ts:36-39`.
- **Deliberately narrower than Editor/Co-author's `bookContext`** — only the language string is
  threaded through, not the whole `Book`. Critic stays scene/selection-scoped by design (the same
  ADR-0008 boundary the Sprint 13 revision above records) — `bookLanguage` is the minimal
  addition that lets Critic's comments follow the book's declared language without widening that
  scope. Source: `route.ts`'s own header comment (lines 13-17).
- **Scope of the effect is deliberately partial:** only the `comment` field of each `reviews[]`
  entry follows `bookLanguage` — `category` and `severity` stay the fixed English enum values
  regardless of `bookLanguage`; the system prompt explicitly protects this. Source: `route.ts:79`
  ("The `category` and `severity` values themselves must stay exactly as specified above (the
  English enum values) — never translate them.").
- **Backward compatible by construction:** when `bookLanguage` is absent, behavior is
  byte-identical to pre-Sprint-15 (`"Russian"` was already this Expert's de facto default before
  any explicit language instruction existed).
- **Live-verified at the time, not re-verified by this documentation-only revision:**
  `docs/task-bus/queue/done/Sprint-15-Step-01-ARP.md` records a real Critic call with
  `bookLanguage: "Ukrainian"` returning `comment` in Ukrainian while `category`/`severity` stayed
  the fixed English enum (`"Style"`/`"medium"`), and separately confirms the `"Russian"` default
  when `bookLanguage` is omitted.
- **Corresponding `AIOperation` payload:** `critic_review` gained optional
  `bookLanguage?: string`, forwarded by `aiBus.execute()` when set.
  Source: `apps/studio/src/ai/operations.ts:56-60`.

## Revision (Sprint 19 Steps 02-03): optional `subcategory`

This section is an addition, not a rewrite. The full design rationale, the four subcategories'
labels (EN/RU), and the UI are ratified separately in
[ADR-0009](ADR-0009-critic-subcategories.md) — this revision only folds the resulting
request-schema fact back into this ADR's own Request/Response Schema description, answering the
question [ADR-0006](ADR-0006-reader-expert-contract.md)'s own Review Trigger raised on Critic's
behalf ("Critic gains its own thematic subcategories (Sprint 18) — check whether it should reuse
the same named-instance mechanism this revision gave Reader, or needs a genuinely different
shape"); this ADR's own Review Trigger (above, unedited) does not itself name subcategories.

- **What changed:** the request body gained an optional `subcategory: string` field. When it
  matches one of four known keys (`continuity`, `fact`, `developmental`, `style`), a
  subcategory-specific suffix is appended to the base system prompt, narrowing Critic's focus to
  that thematic lens; an absent or unrecognized value leaves the base prompt unchanged.
  Source: `route.ts:23-30` (`CRITIC_SUBCATEGORY_PROMPTS`), `:40-41` (`subcategory` read from
  `body`), `:74-77` (suffix composition).
- **Answers the question above:** ADR-0009 chose a request-body field + prompt-suffix mechanism,
  not a new domain concept and not the named-instance mechanism ADR-0006 gave Reader
  (`AssistantThread.persona`) — Critic's UI still surfaces only its single most recent thread,
  unaffected by this revision.
- **Response shape unaffected:** `reviews[]` keeps its `category`/`severity`/`comment` shape —
  `subcategory` narrows what Critic looks for, not the schema it reports in (matching
  ADR-0009's own "Response Format" section).
- **Backward compatible by construction:** when `subcategory` is absent or unrecognized, the
  system prompt is byte-identical to before this revision.
- **Corresponding `AIOperation` payload:** `critic_review` gained optional
  `subcategory?: string`. Source: `apps/studio/src/ai/operations.ts:61-65`.

## Revision (2026-07-10): consolidated current Request/Response Schema

Three separate revisions since Sprint 08 (above) leave the original Decision section's
`{ text: string }` schema historically accurate for Sprint 08 only, not for the Expert as it
runs today. This section exists purely so a reader does not have to reconstruct the current
shape by hand from three separate diffs — it is a summary of the revisions above, not a new
decision.

- **Current request shape, read directly from `route.ts` as of this revision:**
  ```json
  {
    "sceneText": "string (required)",
    "messages": [{ "role": "user"|"assistant", "content": "string" }, ...] (required),
    "bookLanguage": "string (optional — defaults to 'Russian')",
    "subcategory": "string (optional — one of continuity|fact|developmental|style; unrecognized values are ignored, same as absent)"
  }
  ```
  Source: `route.ts:33-41`.
- **Response shape is unchanged from the original Decision section:** `{ ok: true, reviews:
  [{ category, severity, comment }] }` on success; `{ ok: false, error: string }` on failure —
  HTTP 400 for `sceneText`/`messages` input validation, HTTP 500 for either a JSON-parse failure
  of the model's raw output or any other runtime exception. None of the three revisions above
  touch the response shape.
- **On this ADR's Consequences section, above (not edited by this revision):** it states "The
  Expert Contract family now has two ratified members with one shared request shape (`{ text
  }`)..." — as of this revision, that phrase accurately describes Sprint 08's original state
  only. The shared request shape across all four Experts moved to `sceneText` + required
  `messages` (plus each Expert's own optional fields) in Sprint 13. The two related ADRs
  document the same fact two different ways:
  [ADR-0004](ADR-0004-expert-contract-specification.md)'s own Sprint 15 revision flags this as
  a known, not-yet-folded-back gap for Line Editor's Decision section (still showing the
  pre-Sprint-13 `{ text }` shape), while
  [ADR-0006](ADR-0006-reader-expert-contract.md)'s Request/Response Schema section was itself
  updated in place to show Reader's current `sceneText`/`messages`/`persona`/`bookLanguage`
  shape directly. This ADR-0005 revision follows neither precedent exactly: it leaves the
  original Decision/Consequences sections untouched (matching ADR-0004's approach) while still
  giving a reader the full current shape, via the consolidated schema above (closer to what
  ADR-0006 shows, without editing the original section to do it).
