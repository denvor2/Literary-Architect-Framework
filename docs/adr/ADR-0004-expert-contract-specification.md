# ADR-0004: Expert Contract Specification

- **Status:** Accepted
- **Date:** 2026-07-05
- **Deciders:** Product Owner, Architect, Programmer (Executor)
- **Supersedes:** [ADR-0002](ADR-0002-expert-contract-vision.md) (Expert Contract Vision)

**2026-07-05 annotation:** the Review Trigger condition "a second AI Expert is proposed" fired
— see [ADR-0005](ADR-0005-critic-expert-contract.md) (Critic Expert Contract), which examines
the contract below against that second real example. This ADR's Decision text is unchanged by
that annotation.

**2026-07-06 annotation:** Sprint 12 extended `/api/line-editor` with an optional `bookContext`
field — see "Revision (Sprint 12): optional `bookContext`" below, and
[ADR-0008](ADR-0008-coauthor-expert-contract.md) (Co-author Expert Contract), which records the
change from the new Expert's side. The Request/Response Schema section above still accurately
describes the contract when `bookContext` is absent; it is not rewritten by this annotation.

## Context

[ADR-0002](ADR-0002-expert-contract-vision.md) deliberately deferred the concrete Expert
Contract — interface shape, input/output schema, prompt template format, versioning scheme —
until "the first implementation discovers the contract." That implementation, the Line Editor
(Sprint 04), has existed and been live-validated since Sprint 04, and Sprint 06 built an entire
four-layer AI Bus (`Operation → Context Envelope → Response → Applied Response`) on top of it
without ever formalizing what the contract underneath actually is. `PROJECT_STATE.md`'s Open
Decisions has carried "Expert Contract ratification" as pending since Sprint 04 — three sprints
without resolution.

This gap became architecturally blocking, not just overdue paperwork, once Sprint 07 planning
considered a second Expert (Critic/Reader producing genuine Review output): ADR-0002's own
Review Trigger states that a second Expert must not be built before the contract is ratified.
Sprint 07 Step 00 formalized the human/AI collaboration protocol (Architect/Programmer roles,
git-based queue) but explicitly left the Expert Contract itself for this step. This ADR is that
follow-up, written by reading the Line Editor's actual, already-running code — not by
designing a new schema.

## Decision

The Expert Contract is extracted, verbatim, from the current Line Editor implementation. Every
statement below is grounded in a specific file and line; no field is introduced that the code
does not already have.

### Request/Response Schema (the Expert boundary: `/api/line-editor`)

- **Request:** `POST /api/line-editor` with JSON body `{ text: string }`.
  Source: `apps/studio/src/app/api/line-editor/route.ts:8-9`
  (`const body = await request.json(); const text = body?.text;`).
- **Input validation:** if `text` is missing or not a string, the Expert returns
  `{ ok: false, error: "No text provided." }` with HTTP 400.
  Source: `route.ts:11-13`.
- **Success response:** `{ ok: true, result: string }`, where `result` is the model's edited
  text, extracted from the first `text`-type content block in the Anthropic response (empty
  string if none found).
  Source: `route.ts:24-26`.
- **Failure response (runtime exception):** `{ ok: false, error: string }` with HTTP 500;
  `error` is `error.message` if the caught value is an `Error`, else the literal string
  `"Unknown error"`.
  Source: `route.ts:27-29`.
- **Model and prompt are fixed, not parameterized:** model `"claude-sonnet-5"`, `max_tokens:
  1024`, and a single hardcoded system prompt ("You are a line editor. Fix grammar,
  punctuation, and word choice... Do not restructure the content. Return only the edited text,
  nothing else.").
  Source: `route.ts:17-22`. There is no request field that changes model, prompt, or behavior —
  every call to this Expert performs the same operation.

### Position in the AI Bus v5 Chain

The Expert Contract above is wrapped, not replaced, by four structural layers introduced in
Sprint 06. Each layer's actual field set, per current code:

1. **`AIOperation`** — `{ type: "improve_text"; payload: { text: string; sceneId?: string;
   chapterId?: string } }`. `type` is a single string literal today — no union, no second
   variant exists.
   Source: `apps/studio/src/ai/operations.ts:8-15`.
2. **`AIContextEnvelope`** — `{ operation: AIOperation; context: { sceneId?: string;
   chapterId?: string; bookTitle?: string } }`.
   Source: `apps/studio/src/ai/context.ts:11-18`. `context` is carried but **not read** by the
   Bus — confirmed by its own file comment (`context.ts:4`) and by `aiBus.ts`'s comment
   (`aiBus.ts:13-14`) stating it is "deliberately unread/unused for logic."
3. **`aiBus.execute(envelope)`** — extracts `envelope.operation.payload.text`
   (`aiBus.ts:26`), POSTs it to `/api/line-editor` with body `{ text }` (`aiBus.ts:27-31`,
   byte-identical to the Expert's own request shape above), and either throws (see Error Model,
   below) or returns an `AppliedAIResponse` (`aiBus.ts:36-47`).
4. **`AIResponse`** — `{ text: string; meta: { operationType: string } }`.
   Source: `apps/studio/src/ai/response.ts:8-13`. `text` is `data.result` from the Expert's raw
   response, unmodified (`aiBus.ts:38`); `meta.operationType` is set to `envelope.operation.type`
   (`aiBus.ts:40`) but is not read anywhere else in the codebase today — confirmed by
   `response.ts:4-5`'s own comment ("not read by the UI yet").
5. **`AppliedAIResponse`** — `{ response: AIResponse; domain: { sceneId?: string; chapterId?:
   string; bookTitle?: string }; flags: { isSceneAware: boolean } }`.
   Source: `apps/studio/src/ai/applier.ts:9-19`. `domain` is `envelope.context` passed through
   unchanged (`aiBus.ts:43`); `flags.isSceneAware` is the hardcoded literal `false`
   (`aiBus.ts:44-46`), never computed from anything.

**The Expert Contract, precisely, is the request/response schema described in "Request/Response
Schema" above.** Everything in "Position in the AI Bus v5 Chain" is Bus-side structure around
that contract — the contract itself does not include `context`, `domain`, or `flags`, since
none of those fields reach the Expert or originate from it.

### Error Model

- The Expert's own error contract is the `{ ok: false, error: string }` shape described above —
  this is what the HTTP boundary guarantees.
- The Bus does **not** preserve this shape to its own caller. `aiBus.execute()` converts
  `{ ok: false, error }` into a **thrown JavaScript `Error`** (`aiBus.ts:33-35`:
  `if (!data.ok) { throw new Error(data.error); }`) — callers of `aiBus.execute()` must
  handle a rejected Promise, not inspect a returned `ok` field.
- The UI's actual handling of that throw is a generic, undifferentiated error state: `EditorArea.tsx`'s
  `handleImprove` wraps the call in `try { ... } catch { setStatus("error"); }`
  (`apps/studio/src/components/EditorArea.tsx:213-214`) — the caught error's message is
  discarded; the UI cannot today distinguish "no text provided" from "Anthropic API failure"
  from any other failure mode. **This is a fact about the current implementation, not a
  requirement being newly imposed** — no behavior changes as a result of recording it here.

### Deterministic / Stateless Behavior

- The Expert holds no state between calls: each request receives only `text` and returns only
  a `result` derived from that single input. There is no session, cache, or memory field
  anywhere in `route.ts`.
- This has been empirically verified twice, not just architecturally assumed:
  - Sprint 05: "Прямой вызов с одинаковым входным текстом дважды подряд вернул идентичный
    результат — подтверждает отсутствие памяти/состояния на стороне эндпоинта."
    Source: `docs/reports/SPRINT-05.md:124` (see also line 136).
  - Sprint 06: every one of the nine steps' live verification runs returned the identical
    result and identical error response for the same inputs across separately-started server
    instances. Source: `docs/reports/SPRINT_06_REPORT.md:77-80`.
- **Guarantee to a caller:** identical `text` input yields the same edited-text output within
  the normal non-determinism of an LLM call (the underlying model is not seeded/pinned for
  exact reproducibility — "identical" here is what was observed in practice, not a
  cryptographic guarantee) and never reflects any prior call.

### Scope: One Expert

This contract describes **one** AI Expert — the Line Editor — realizing **one** Product Role
mapping used in the UI today (all four visible modes — Co-author, Editor, Critic, Reader — call
this same Expert; see `docs/product/EXPERT_CATALOG.md` and `apps/studio/src/components/EditorArea.tsx`'s
`MODE_INFO` table, which relabels but never changes the request). It is not a general Expert
interface and does not attempt to anticipate a second Expert's shape. Whether and how a second
Expert fits this contract is exactly what the Review Trigger, below, governs — this ADR does
not pre-approve or pre-design that case.

## Architectural Principles

What ADR-0002 anticipated, checked against what the code actually shows:

- **Confirmed:** "The first implementation discovers the contract; it does not implement a
  predefined one." The schema above was read directly from `route.ts` and the `ai/*.ts` files —
  nothing here was designed before the code existed.
- **Confirmed:** "Discovery over specification" — the AI Bus v5 layers (Sprint 06) were built
  *after* the Line Editor and deliberately keep `context`/`domain`/`flags` unread until a real
  need consumes them, rather than speculatively wiring them up.
- **Not confirmed by code, and not assumed here:** ADR-0002's "Generic and reusable... a
  domain-specific Expert... should be addable without changing the core architecture" is a
  vision-level goal that has never been tested — only one Expert has ever existed. This ADR
  does not claim the architecture already supports a second Expert; it explicitly declines to
  claim that (see Consequences).
- **Not confirmed by code:** ADR-0002's "Expert Independence" section (no Expert depends on
  another Expert's state) is likewise untested with only one Expert in existence. Recorded as
  an open assumption, not a validated property.

## Consequences

**Now possible:**

- A second AI Expert may be proposed and reviewed against this contract, instead of against an
  unratified vision document — this is the concrete unblock ADR-0002's Review Trigger was
  gating.
- Any future Expert's request/response shape can be compared directly against the
  Request/Response Schema above to check whether it fits within the existing AI Bus v5 layers
  unmodified, or requires extending `AIOperation`'s `type` union (a small, contract-visible
  change) versus requiring a new Bus layer (a larger, architecture-visible change).

**Still not possible / not decided by this ADR:**

- This ADR does not itself introduce a second Expert, a second `AIOperation.type`, or any code
  change — per this task's explicit constraint, and consistent with "discovery over
  specification": the contract is ratified from what exists, not extended speculatively in the
  same step.
- This ADR does not resolve `docs/product/DOMAIN_MODEL.md`'s Open Questions (which Expert(s)
  back Co-author/Critic/Reader) — that mapping remains undecided.
- The Bus-side error-shape loss (thrown `Error`, undifferentiated UI state) is recorded as a
  known characteristic, not something this ADR fixes or requires fixing.

## Review Trigger

Revisit (supersede) this ADR when any of the following occurs:

- A second AI Expert is proposed whose request/response shape does not fit the Request/Response
  Schema above without modification — the contract must be re-examined against a second real
  example, not patched informally.
- The Bus's error handling changes (e.g. if a future Expert needs to return a typed/structured
  error rather than a thrown generic `Error`) — this ADR's Error Model section would no longer
  describe the system accurately.
- `AIOperation.type` gains a second variant — the "Scope: One Expert" section above must be
  revisited at that exact point, not before.
- The Expert's determinism guarantee is found to be violated in practice (e.g. a future Expert
  or a future version of this one exhibits cross-call memory).

## Revision (Sprint 12): optional `bookContext`

This section is an addition, not a rewrite — the Request/Response Schema section above remains
the accurate description of this Expert's contract whenever `bookContext` is absent from the
request.

- **What changed:** `POST /api/line-editor` now also accepts an optional `bookContext` field in
  its JSON body: `{ text: string, bookContext?: object }`.
  Source: `apps/studio/src/app/api/line-editor/route.ts:14-16`
  (`const text = body?.text; const bookContext = body?.bookContext;`).
- **Backward compatible by construction:** when `bookContext` is absent, `userContent` is
  `text` unchanged (`route.ts:27-29`) — byte-identical to the pre-Sprint-12 request this ADR
  originally described. No existing caller of this Expert is required to change.
- **What did not change: the task.** The system prompt still instructs the model to fix
  grammar/punctuation/word choice and preserve voice and meaning; the added sentence is
  explicitly scoped to *consistency only* — "use it only to keep character names and
  established facts consistent — never use it to rewrite, extend, or add new content beyond the
  given text." Source: `route.ts:34`. When `bookContext` is present, the user-content prefix
  repeats the same constraint (`route.ts:28`: "for consistency only... do not use it to rewrite
  or expand the text beyond what is given below"). Editor did not become a generative Expert —
  see [ADR-0008](ADR-0008-coauthor-expert-contract.md) for the Expert (Co-author) that owns
  that generative role, and for the per-Expert context-scope table recording why Editor gets
  the whole `Book` optionally while Critic/Reader do not get it at all.
- **Live-verified, not just read from the diff** (Sprint-12-Step-02, repeated in
  Sprint-12-Step-04 through the real UI path): an unusual character name present only in
  `bookContext` was preserved verbatim in the edited output, and the output did not expand
  beyond the scope of the input `text` even though the full book preceded it in the prompt.
- **"Scope: One Expert" (above) is updated by this revision, not superseded by it:** a fourth
  visible mode, Co-author, now maps to a *different* Expert (`/api/coauthor`, ADR-0008) rather
  than relabeling this same one — the claim in that section that "all four visible modes...
  call this same Expert" is, as of Sprint 12, accurate only for Editor, Critic, and Reader.
  Ratified as of Sprint 12.
