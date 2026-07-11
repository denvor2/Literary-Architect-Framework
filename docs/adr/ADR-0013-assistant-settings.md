# ADR-0013: Per-Assistant Settings — Admin Default + Gated User Override

- **Status:** Accepted
- **Date:** 2026-07-11
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0004](ADR-0004-expert-contract-specification.md) (Expert Contract),
  [ADR-0009](ADR-0009-critic-subcategories.md) (Critic Subcategories — prompt-suffix precedent),
  [ADR-0011](ADR-0011-book-field-operations.md) (Book Field AI Suggestions),
  [ADR-0012](ADR-0012-persistence-migration.md) (Persistence Migration — temporary single-user
  stopgap). Also relates forward to the not-yet-written Sprint 29 Multi-user ADR (ADR-0015 per
  current docs/project/ROADMAP_18-27.md numbering) — referenced here as a known future consumer
  of this decision, not authored by this document.

## Context

Product Owner asked (2026-07-11, raw list of 8 UI/design items for Sprint 25) for a "gear"
settings affordance on each of the 4 assistant modes (Co-author/Editor/Critic/Reader): a display
name, a system-prompt-level customization, and a set of "typical request" quick-actions.

Reading the actual code shows this is a new architectural surface, not a small UI addition: each
Expert's system prompt is a hardcoded string constant inside its own route file
(apps/studio/src/app/api/coauthor/route.ts, line-editor/route.ts, critic/route.ts,
reader/route.ts) - there is no storage, no override mechanism, and neither Book nor any Prisma
table holds anything resembling a customizable prompt or assistant name today.

A planning pass over this same Sprint 25 surfaced a direct overlap: docs/project/
ROADMAP_18-27.md's Sprint 29 (Multi-user Admin/User system) already fixes, from the same
Product Owner conversation on the same day, an Admin capability described as "режим настроек с
просмотром и тонкой настройкой промптов AI-экспертов (Line Editor/Critic/Reader/Co-author) ...
system-промпты - константы в коде, потребуется вынести их в редактируемое хранилище, доступное
только Админу." Without a single target architecture, Sprint 25's gear dialog and Sprint 29's
Admin panel risked becoming two competing mechanisms for the same underlying thing.

Product Owner resolved this overlap directly (2026-07-11): it is one architecture, not two.

## Decision

### Target architecture (one model, two UI surfaces)

- Admin sets the default system prompt (plus display name and typical-request set) for each of
  the 4 assistant modes. This default applies instance-wide, to every user, unless overridden.
- A regular User may customize their own version of the same three things (name/prompt/typical
  requests) for their own use - but only if permitted. Permission is gated either by an explicit
  per-user flag set by Admin, or by the user's subscription/plan tier. The exact gating
  mechanism (explicit permission vs. plan tier) is not decided by this ADR - flagged below as an
  explicit open nuance for Sprint 29/ADR-0015 to resolve when real roles exist, not a blocker
  here.
- Sprint 25's "gear" dialog and Sprint 29's Admin settings panel are two UI surfaces onto this
  one model - not independent mechanisms. Sprint 29 must not redesign this from scratch; it
  should extend the storage/gating introduced here with real Admin/User roles.

### Storage scope

- Default (Admin-authored) values: one record per AssistantMode (coauthor/editor/critic/reader),
  instance-wide - not per Book, not per User. This matches Sprint 29's own framing of the Admin
  capability as an installation-wide setting, not a per-book one.
- User override (once real Users exist, Sprint 29): one record per (User, AssistantMode) pair,
  present only if that user has customized that mode and has permission to do so.
- Sprint 25 has no real Users yet (ADR-0012's single local-user stopgap) - see Implementation
  Constraint below for how this ADR's model degrades safely to today's single-user reality.

### Override semantics - append, not replace

A customized prompt (whether it is the Admin default or a permitted user override) is APPENDED
as additional instruction text after the existing hardcoded base prompt in each Expert's route
file - the same pattern Critic subcategories already established (ADR-0009's
CRITIC_SUBCATEGORY_PROMPTS suffix onto CRITIC_BASE_PROMPT). This is a deliberate, conservative
choice: the base prompt is what enforces each Expert's machine-readable response-format contract
(Critic's structured reviews[], Co-author structure's JSON shape, etc.). Letting a free-text
custom prompt fully replace the base prompt risks silently breaking that contract the moment a
user or Admin writes a prompt that doesn't preserve it. If append-only proves too limiting in
practice (someone wanting to override behavior the base prompt insists on), revisit - a full-
replace model is not being designed preemptively (evolutionary architecture, ADR-0002).

Display name is a pure UI label, never sent to the model - freely overridable, no contract risk.
"Typical request" quick-actions are preset buttons that pre-fill the chat input text (the same
UX pattern as the existing Critic subcategory pill-buttons) - not a new AI Bus operation type,
no separate contract risk.

### Implementation constraint for Sprint 25 Step 03 (explicit - do not reinterpret)

The real Admin/User distinction does not exist yet. ADR-0012 established a single stopgap local
user for the whole Phase 1 MVP; real roles arrive only with Sprint 29 (ADR-0015, not yet
written). Sprint 25's "gear" dialog implementation must treat the current single user as having
full (Admin-equivalent) access - every mode's name/prompt/typical-requests is directly editable
by the one existing user, with no permission-check UI at all, because there is no second role to
gate against yet. Do NOT build a speculative permission/plan-gating system ahead of Sprint 29 -
that would be designing a capability this project has no working example of yet (evolutionary
architecture, ADR-0002). When Sprint 29 introduces real Users, it must explicitly migrate this
single-user "everything directly editable" state into "Admin default + gated override" - a
known, flagged migration step for that future sprint, not solved here.

## Consequences

- One shared model for prompt customization across Sprint 25 (gear dialog) and Sprint 29 (Admin
  panel) - no throwaway/parallel mechanism, no migration surprise later.
- New storage surface: per-AssistantMode default record (Sprint 25) plus, later, per-(User,
  AssistantMode) override record (Sprint 29) - schema shape decided now, User-scoping wired up
  later when Users exist.
- Append-only override keeps every Expert's existing response-format contract intact by
  construction - no additional runtime validation needed to guard against a broken JSON contract
  from a freely-authored prompt.
- Sprint 25's implementation is explicitly a stopgap (single user = full access) - this must be
  visible in that Step Card so no one invents a fake permission system early, and so Sprint 29's
  scope explicitly includes the migration from stopgap to gated model.

## Known Gaps / Review Trigger

- Gating mechanism (permission flag vs. plan/tier) is unresolved - deferred to Sprint 29/
  ADR-0015. Revisit when real Users/roles are designed.
- No book-scoping - prompt/name/typical-request customization is instance/user-wide, not
  per-Book. Revisit if writers want a different assistant personality per book.
- Append-only semantics may prove limiting - revisit if writers need to fully replace an
  Expert's behavior rather than add to it (would require separately guarding each Expert's
  response-format contract, not attempted here).
- Sprint 29 migration is not designed - this ADR only states that Sprint 29 must migrate the
  Sprint 25 stopgap into the gated model; the concrete migration mechanics (schema change, data
  backfill) are Sprint 29's own responsibility, not designed here (evolutionary architecture).
