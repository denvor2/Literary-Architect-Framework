# ADR-0009: Critic Subcategories

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0005](ADR-0005-critic-expert-contract.md) (Critic Expert Contract)

## Context

Sprint 08 built Critic as a single general-purpose literary critic — one system prompt, one
set of categories (Plot/Characters/Pacing/Style/Dialogue/General). The Product Owner wants
focused thematic lenses so a writer can request a specific kind of feedback without wading
through irrelevant findings. This ADR designs four subcategories and how they flow through
the existing Critic infrastructure.

## Decision

### Subcategories

| Key | Label (EN) | Label (RU) | Focus |
|-----|-----------|------------|-------|
| `continuity` | Continuity | Связность | Plot holes, timeline contradictions, unresolved threads |
| `fact` | Fact | Достоверность | Factual accuracy, worldbuilding consistency, logical plausibility |
| `developmental` | Developmental | Развитие | Character arcs, emotional depth, structural pacing |
| `style` | Style | Стиль | Prose quality, dialogue voice, sentence rhythm, word choice |

### Transmission Mechanism

Optional `subcategory` field in the request body (not a query param, not a separate endpoint).
When present, a subcategory-specific system prompt suffix is appended to the base Critic
system prompt. When absent, behavior is unchanged — fully backward compatible.

Source of truth for subcategory → prompt mapping: a `CRITIC_SUBCATEGORY_PROMPTS` constant in
`apps/studio/src/app/api/critic/route.ts`.

### Response Format

Unchanged — `reviews[]` with `category`/`severity`/`comment`. The subcategory narrows the
lens (what Critic pays attention to), not the output shape. The `category` values in
`reviews` may overlap with subcategory names but are not constrained to match — Critic still
uses its own judgment about which category each finding belongs to.

### Backward Compatibility

- `subcategory` is optional everywhere: route, AI Bus operation, UI.
- No subcategory → existing single-prompt behavior, identical to pre-Sprint-19.
- The four subcategories are the only ones for now. Future additions follow the same pattern
  (add to `CRITIC_SUBCATEGORY_PROMPTS`, add to UI radio list).

### AI Bus

`critic_review` operation gains optional `subcategory?: string`. `aiBus.execute()` forwards
it to `/api/critic` in the request body.

### UI

Radio button group in AssistantPanel's Critic mode section, above the input textarea. Four
options: "Все" (no subcategory), "Связность", "Достоверность", "Развитие", "Стиль".
Default: "Все". Switching subcategory does NOT reset the conversation thread — it only
affects the next message sent.

## Consequences

- Critic's single system prompt becomes a base + suffix composition — a minimal, contained
  change to `route.ts`.
- No new domain types, no new AIOperation variants, no new API routes.
- The `category` field in `reviews` stays model-decided, not subcategory-constrained —
  subcategories are a prompt-level lens, not a schema-level filter.

## Known Gaps

- Subcategory labels are hardcoded in both backend (prompt map) and UI (radio buttons).
  A shared constant would reduce drift but is not introduced here — the list is short and
  stable. Revisit if subcategories grow beyond ~6.
- No runtime validation that `subcategory` is one of the known values — unknown values are
  harmlessly ignored (the base prompt applies). Acceptable at this stage.

## Review Trigger

Revisit when:
- More than 6 subcategories are needed (consider a dynamic list).
- Subcategories should constrain `reviews[].category` values (schema change).
- The base prompt diverges significantly between subcategories (consider separate routes).
