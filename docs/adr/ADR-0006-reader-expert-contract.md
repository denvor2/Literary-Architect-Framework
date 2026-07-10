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

> **Revised Sprint 13/15.** The original Sprint 09 schema (`{ text: string }`) was renamed to
> `sceneText` and gained a required `messages` array in Sprint 13 (stateless conversation, per
> the convention across all four Experts — ADR-0004 unchanged). Sprint 15 added `bookLanguage`.
> Sprint 14 added optional `persona`. The shape below is current.

- **Request:** `POST /api/reader` with JSON body:
  ```json
  {
    "sceneText": "string (required)",
    "messages": [{ "role": "user"|"assistant", "content": "string" } ...] (required)",
    "persona": "string (optional — named Reader instance persona)",
    "bookLanguage": "string (optional — defaults to 'Russian')"
  }
  ```
  `sceneText` is the scene/selection text to react to. `messages` is the full conversation
  history (client-managed, server is stateless — ADR-0004). `persona` prepends a persona
  instruction to the system prompt when present. `bookLanguage` controls the response language.
  Source: `apps/studio/src/app/api/reader/route.ts:18-29`.
- **Input validation:** missing/non-string `sceneText` → `{ ok: false, error: "No sceneText
  provided." }`, HTTP 400; non-array `messages` → `{ ok: false, error: "messages must be an
  array." }`, HTTP 400; each message validated for `role` (`"user"` or `"assistant"`) and
  string `content`. Source: `route.ts:31-60`.
- **Success response:** `{ ok: true, result: string }` — **the same shape as Line Editor, not
  Critic's `reviews[]` array.** A reader's reaction is a whole piece of prose, not a list of
  discrete findings. Source: `route.ts:78`.
- **Failure response:** `{ ok: false, error: string }`, HTTP 500, same
  `error instanceof Error ? error.message : "Unknown error"` pattern as all other Experts.
  Source: `route.ts:79-86`.
- **Model and prompt are fixed, not parameterized** — same principle as all other Experts:
  model `"claude-sonnet-5"`, `max_tokens: 1024`, one system prompt (parameterized by
  `bookLanguage` and optionally `persona`). Source: `route.ts:66-69`.
- **Language instruction:** the system prompt instructs the model to respond in
  `${bookLanguage}` (defaults to Russian) regardless of the input text's language, unless the
  user explicitly asks for another language. Line Editor and Critic gained the same
  `bookLanguage`/`bookContext.language` following in Sprint 15 Step 01 — Reader is no longer
  the only Expert with a language instruction.

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
- ~~Line Editor and Critic's prompts are not localized to Russian~~ — **Resolved Sprint 15
  Step 01:** all four Experts now follow the book's language (`bookContext.language` or
  `bookLanguage`), not hardcoded Russian.
- As with Critic, `result`/`result.response.text` is not validated at runtime beyond being a
  string — consistent with the same discovery-stage tolerance already accepted for all prior
  Experts.
- ~~ADR-0006's Request/Response Schema section still described the pre-Sprint-13 `{ text }`
  shape~~ — **Resolved by this revision** (the schema section above now reflects
  `sceneText`/`messages`/`persona`/`bookLanguage`).

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
- ~~Localization of Line Editor/Critic's prompts~~ — Resolved Sprint 15 Step 01.

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
  **Resolved:** Co-author added Sprint 12 as the fourth variant — its payload shape differs
  (`bookContext` required, no `sceneId`/`chapterId`), but the response shape is still string-
  based (Revision, not Review). The two-shape pattern (string response vs. Critic's array)
  still holds.
- Co-author or Editor gets a concrete Expert mapping distinct from Line Editor.
  **Partially resolved:** Co-author → Co-author Expert (`/api/coauthor`) ratified as ADR-0008.
  Editor remains mapped to Line Editor — whether Editor should be a composite of several
  ADR-0002 Experts is unspecified.
- ~~Line Editor's or Critic's prompts are localized to Russian (Sprint 15)~~ — Resolved.
- Critic gains its own thematic subcategories (Sprint 18) — check whether it should reuse the
  same named-instance mechanism this revision gave Reader, or needs a genuinely different shape.
- ~~This ADR's Request/Response Schema section is refreshed to reflect Sprint 13's
  `sceneText`/`messages` rename~~ — Resolved by this revision.
