# ADR-0006: Reader Expert Contract

- **Status:** Accepted
- **Date:** 2026-07-05
- **Deciders:** Product Owner, Architect, Programmer (Executor)
- **Relates to:** [ADR-0004](ADR-0004-expert-contract-specification.md) (Line Editor),
  [ADR-0005](ADR-0005-critic-expert-contract.md) (Critic)

## Context

[ADR-0005](ADR-0005-critic-expert-contract.md) ratified Critic as the project's second Expert
and left Reader as future work. Sprint 09 (Steps 01–03) built and shipped Reader: a backend
route, a third `AIOperation` variant, real AI Bus dispatch, and UI wiring. This ADR ratifies
that Expert's contract the same way ADR-0004/0005 did — read from the already-running code,
not designed in the abstract.

## Decision

### Request/Response Schema (the Expert boundary: `/api/reader`)

- **Request:** `POST /api/reader` with JSON body `{ text: string }` — the same granularity as
  Critic: an arbitrary fragment, not necessarily a whole Scene.
  Source: `apps/studio/src/app/api/reader/route.ts:8-10`.
- **Input validation:** identical pattern to Line Editor and Critic — missing/non-string
  `text` → `{ ok: false, error: "No text provided." }`, HTTP 400.
  Source: `route.ts:12-17`.
- **Success response:** `{ ok: true, result: string }` — **the same shape as Line Editor, not
  Critic's `reviews[]` array.** This is a deliberate decision, not an oversight: a reader's
  reaction is a whole piece of prose, not a list of discrete findings.
  Source: `route.ts:30` (`return NextResponse.json({ ok: true, result });`).
- **Failure response:** `{ ok: false, error: string }`, HTTP 500, same
  `error instanceof Error ? error.message : "Unknown error"` pattern as both existing Experts.
  Source: `route.ts:31-37`. Unlike Critic, there is no JSON-parse failure mode here, because
  the response is never parsed as structured data — the raw model text is the result.
- **Model and prompt are fixed, not parameterized** — same principle as both existing
  Experts: model `"claude-sonnet-5"`, `max_tokens: 1024`, one hardcoded system prompt.
  Source: `route.ts:22-25`.
- **First Expert with an explicit language instruction.** The system prompt explicitly
  instructs the model to respond in Russian regardless of the input text's language ("Respond
  in Russian, regardless of the language of the text you are given, unless the user explicitly
  asks for another language" — `route.ts:25`). Line Editor and Critic's prompts currently carry
  no such instruction; retroactively localizing them is out of scope here and is separately
  planned for Sprint 14 (per `Sprint-09-Vision-Amendments.md`'s Поправка 1 and the Sprint-09-
  Step-01 REVIEW).

### Position in the AI Bus v5 Chain

- **`AIOperation`** gained its third variant: `{ type: "reader_reaction"; payload: { text,
  sceneId?, chapterId? } }` — same payload shape as the other two.
  Source: `apps/studio/src/ai/operations.ts:26-33`.
- **`aiBus.execute()`**'s third branch: for `reader_reaction`, calls `/api/reader` with the
  same `{ text }` body shape, and — because the response is already a plain string —
  assigns `data.result` to `resultText` directly.
  Source: `apps/studio/src/ai/aiBus.ts:53-65`.
- **First variant added without incurring technical debt.** Unlike `critic_review`, which
  required `JSON.stringify`/a `TODO` comment because `AIResponse.text` expects a string but
  Critic's native response is an array, `reader_reaction`'s response is already
  string-shaped — no stringify step, no TODO.
  Source: `aiBus.ts:63-64` (comment: "No stringify/TODO needed here — this Expert's response
  is already a plain string, the same shape AIResponse.text expects natively.").
- The consuming UI (`EditorArea.tsx`) assigns `result.response.text` directly to a new
  `readerReaction` state variable — no parsing step, unlike Critic's `JSON.parse`.
  Source: `EditorArea.tsx:291-311` (`handleReader`).

### Product Role Mapping

- **Reader (visible Product Role) → Reader Expert (`/api/reader`) is now a direct,
  unambiguous 1:1 mapping** — the second such resolved mapping in the project, after Critic.
  Source: `EditorArea.tsx`'s mode dispatch (`mode === "Critic" ? handleCritic : mode ===
  "Reader" ? handleReader : handleImprove`).
- **Co-author and Editor remain unresolved** — both still call `improve_text` (the Line
  Editor Expert) under different labels. This ADR does not change or attempt to resolve that —
  it remains an explicitly separate, still-open point (see
  `docs/product/DOMAIN_MODEL.md`'s Open Questions, updated by this ADR for Reader only).

## Known Gaps (recorded, not resolved by this ADR)

- Co-author/Editor → Expert mapping remains unresolved, as stated above.
- `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`'s Section 7 envisions multiple named Reader
  instances (3–4, matching the original MVP Scope) rather than the single generic Reader
  implemented here — explicitly future work, not attempted by this ADR or Sprint 09.
  **Resolved by the Sprint 14 revision below** — this bullet is historical (accurate as of
  Sprint 09), not current.
- Line Editor and Critic's prompts are not localized to Russian — planned for Sprint 14, not
  addressed here. **Still open** — moved to Sprint 15 per `docs/vision/SPRINT_ROADMAP.md`; the
  Sprint 14 revision below addresses `persona`/multiple instances only, not this.
- As with Critic, `result`/`result.response.text` is not validated at runtime beyond being a
  string — consistent with the same discovery-stage tolerance already accepted for both prior
  Experts.

## Consequences

**Now recorded as fact:**

- The Expert Contract family now has three ratified members: two returning a single string
  (Line Editor, Reader) and one returning a structured array (Critic) — future Experts should
  be checked against whichever pattern actually fits their output, not assumed to be one or
  the other.
- AI Bus v5's dispatch mechanism is validated by a third real case, added without introducing
  new technical debt — confirms the pattern from ADR-0005 generalizes cleanly to an Expert
  whose response shape already matches `AIResponse.text` natively.

**Still not decided by this ADR:**

- The Co-author/Editor → Expert mapping.
- ~~Whether/when multiple named Reader instances (per the vision document) will be built.~~
  Built, Sprint 14 — see the Revision section below.
- Localization of Line Editor/Critic's prompts (moved to Sprint 15,
  `docs/vision/SPRINT_ROADMAP.md`).

## Revision (Sprint 14 Step 01/02): optional `persona`, multiple named instances

This section is an addition, not a rewrite — the Request/Response Schema section above remains
the accurate description of this Expert's contract whenever `persona` is absent from the
request, exactly as ADR-0004's own `bookContext` revision did for Line Editor.

- **What changed:** `POST /api/reader` now also accepts an optional `persona` field in its JSON
  body. When present, it is prepended to the system prompt: `You are reading and reacting as:
  ${persona}. Stay in this persona throughout.\n\n` + the existing prompt text.
  Source: `apps/studio/src/app/api/reader/route.ts` (Sprint-14-Step-01).
- **Backward compatible by construction:** when `persona` is absent, the system prompt is
  byte-identical to before this revision — no existing caller is required to change.
- **Live-verified, not just read from the diff** (Sprint-14-Step-01, repeated end-to-end through
  the real UI path in Sprint-14-Step-02): the same scene text sent with two different personas
  ("десятилетний ребёнок" vs. "суровый литературный критик со стажем 40 лет") produced genuinely
  different reactions in tone and content, not a cosmetic label — confirming `persona` actually
  changes model behavior, not just request shape.
- **This resolves this ADR's own "Known Gap"/Review Trigger about multiple named Reader
  instances** (vision document Section 7, "3–4 Readers" from the original MVP Scope): each
  named instance is a `AssistantThread` (`apps/studio/src/domain/model.ts`) carrying its own
  `name` + optional `persona` — not a new domain concept, the existing shared thread shape used
  by all four Product Roles gained one optional field. The UI
  (`apps/studio/src/components/AssistantPanel.tsx`'s `ReaderPanel`, Sprint-14-Step-02) surfaces
  all of a book's Reader threads as named, comparable cards — create/rename/delete, single-view
  switching, and a side-by-side compare grid for 2+ selected instances — rather than exposing
  only the single most recent one, which is what Critic still does (out of scope for this
  revision; Critic's own thematic subcategories are a different, later, not-yet-designed idea —
  vision document Section 7, Sprint 18 per `docs/vision/SPRINT_ROADMAP.md`).
- **Known gap this revision does not address:** this ADR's Request/Response Schema section above
  still describes the pre-Sprint-13 `{ text: string }` request shape. Sprint-13-Step-02 renamed
  this to `{ sceneText: string, messages: ChatMessage[] }` (stateless conversation history, per
  the since-established convention across all four Experts) — that rename was never folded back
  into this ADR. Recorded honestly here rather than left silently stale; a full schema refresh
  is a separate task if/when needed, not attempted by this revision (out of this Step Card's
  Scope).

## Review Trigger

Revisit (amend or supersede) this ADR when any of the following occurs:

- A fourth `AIOperation` variant is added — check whether the two-shape pattern recorded here
  (string vs. structured array) still describes the field, or a third shape emerges.
- Co-author or Editor gets a concrete Expert mapping distinct from Line Editor.
- Line Editor's or Critic's prompts are localized to Russian (Sprint 15, per
  `docs/vision/SPRINT_ROADMAP.md`) — at that point Reader would no longer be the only Expert
  with an explicit language instruction.
- Critic gains its own thematic subcategories (Sprint 18) — check whether it should reuse the
  same named-instance mechanism this revision gave Reader, or needs a genuinely different shape.
- This ADR's Request/Response Schema section is refreshed to reflect Sprint 13's
  `sceneText`/`messages` rename (see the Known Gap immediately above) — until then, treat that
  section as historical (accurate as of Sprint 09), not current.
