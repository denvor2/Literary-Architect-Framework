# Task Bus v4 — Operating Protocol (RC1)

**Status:** Release Candidate 1. **This document is the sole canonical operating protocol for
Literary Studio as of this commit.** [AI_BUS_V3.md](AI_BUS_V3.md) is retained exclusively as a
historical record and must not be treated as an active or authoritative protocol from this
point forward — see Version Evolution below.

This is an evidence-driven revision of v3: every change below is justified by what was
observed operating v3 during Sprint 04, not by speculative redesign. See
[docs/task-bus/EXECUTION_LOG.md](EXECUTION_LOG.md) for the underlying execution history this
revision is based on.

## Roles (carried forward from v3, unchanged)

- **Human (Product Owner)** — approves each Step Card before execution, holds final authority
  over scope and commit, updates `CURRENT_SPRINT.md`.
- **Architect** — reviews the Programmer's output against the active Step
  Card using [REVIEW_FORMAT.md](REVIEW_FORMAT.md), issues `STATUS: OK / FIX / STOP`, and may
  issue an Architect Clarification (see below).
- **Programmer (Executor)** — executes exactly one Step Card at a time,
  produces an ARP, commits only under the Standing Commit Policy below.
- **Git** — the record of truth.

Architect and Programmer (Executor) are roles, not fixed AI models — see
`PROJECT_CHARTER.md`'s Role/Model Binding note. Which model is currently playing which role is
tracked separately from this protocol and may change between sessions.

**Observed in practice:** one human account has issued both Product-Owner-flavored and
Architect-flavored instructions within the same session. This protocol describes roles, not
distinct people — a single human may hold more than one role.

## Step-Based Execution Model, Single Active Step Rule, Deterministic Flow

Unchanged from v3 — see [AI_BUS_V3.md](AI_BUS_V3.md) for the full description. Nothing about
the core Step → Prompt → Execute → Commit → Review → Next Step loop is revised in RC1.

## Bootstrap

Replaces the informal "Bootstrap Set" with explicit, numbered loading levels. See
[BOOTSTRAP.md](BOOTSTRAP.md) for the full level definitions and the confirmation requirement.
Every new session (human or AI) must confirm its bootstrap completed before beginning work.

## Architect Clarification

*(Previously informally called "Architect Override" in chat only — this is its first
persistence to a repository document, not a rename of an existing file.)*

An Architect statement that clarifies how a ratified ADR applies to an ambiguous case is
**not** a change to that ADR and needs no new ADR — but it is not automatically valid either.
Apply this test:

- Does the clarification change the ADR's **Decision** text? → It is a violation-in-disguise
  and requires a superseding ADR, per `PROJECT_CHARTER.md`'s Architecture Authority.
- Does the Decision text stay untouched, with only its application to a specific case being
  specified? → The clarification is binding immediately and should be recorded as a dated
  annotation appended to the ADR (not a rewrite of it).

**Evidence:** at Sprint-04-Step-05, ADR-0002's text ("discover before codifying") was never
touched; the Architect only specified that "implement the Line Editor" meant disposable
discovery code, not a production build. Both readings were always consistent with ADR-0002's
actual Decision text — the ambiguity was in the task instruction, not the ADR. The Programmer's
role is to distinguish these two cases before complying, not to treat every Architect statement
as either automatically binding or automatically suspect.

## Standing Commit Policy

Replaces per-task commit renegotiation. The Programmer may commit automatically only if **all**
of the following hold:

- `STATUS = OK`
- Architect review passed
- No new OPEN risk was introduced by the work
- Definition of Done is satisfied
- The commit is atomic (single logical change, per established discipline)

**Otherwise: STOP.** Do not commit partially, do not commit while a risk remains unresolved,
and do not treat silence as approval.

## Repository-First Enforcement

Strengthens the existing Repository Rule (`docs/project/DEVELOPMENT_WORKFLOW.md`): **any
EXPLORATORY execution that creates reusable architectural knowledge must persist that
knowledge into repository documentation.** Conversation is transport. Repository is knowledge.

This is not a new philosophy — it restates a rule already on record — but it is now explicit
and binding rather than aspirational, because it was not honored in practice (see Bootstrap
B/C Finding, below).

## Binding Rule Update

The Binding Rule now lives, unchanged in location, in
[EXECUTION_ALIGNMENT.md](EXECUTION_ALIGNMENT.md) — updated by this revision to accept either:

1. a verifiable repository artifact, **or**
2. an explicit **"No Artifact Required"** decision, made only by the Architect, recorded on
   the execution entry itself.

See `EXECUTION_ALIGNMENT.md` for the full updated rule; it is not duplicated here, to avoid
exactly the fragmentation risk registered below.

## Version Evolution (v3 → v4)

| Old document | New document | Status |
|---|---|---|
| `docs/task-bus/AI_BUS_V3.md` | `docs/task-bus/TASK_BUS_V4.md` | **Superseded** (kept for history; no longer canonical) |
| `docs/task-bus/BRIDGE.md` | `docs/task-bus/BRIDGE.md` | Unchanged — canonical |
| `docs/task-bus/EXECUTION_LOG.md` | `docs/task-bus/EXECUTION_LOG.md` | Unchanged — canonical (historical record, additive-only) |
| `docs/task-bus/EXECUTION_ALIGNMENT.md` | `docs/task-bus/EXECUTION_ALIGNMENT.md` | **Merged/updated in place** — canonical (Binding Rule extended) |
| `docs/task-bus/EXECUTION_CLOSURE.md` | `docs/task-bus/EXECUTION_CLOSURE.md` | Unchanged — canonical |
| `docs/task-bus/STEP_CARD_TEMPLATE.yml` | `docs/task-bus/STEP_CARD_TEMPLATE.yml` | Unchanged — canonical |
| `docs/task-bus/PROMPT_TEMPLATE.md` | `docs/task-bus/PROMPT_TEMPLATE.md` | Unchanged — canonical (its duplication with `REVIEW_FORMAT.md` remains an OPEN risk, not addressed in RC1) |
| `docs/task-bus/REVIEW_FORMAT.md` | `docs/task-bus/REVIEW_FORMAT.md` | Unchanged — canonical |
| *(none — new)* | `docs/task-bus/TASK_BUS_V4.md` | **New** — canonical operating protocol |
| *(none — new)* | `docs/task-bus/BOOTSTRAP.md` | **New** — canonical (formalizes the previously informal Bootstrap Set) |
| *(chat-only, never a file)* | "Architect Clarification" section, above | **New** — first persistence, not a rename of an existing artifact |

**Nothing is marked obsolete.** No document is deleted — consistent with the additive-only
evolution already established for `CURRENT_STEP.md`/`BRIDGE.md`/`EXECUTION_LOG.md`.

## Protocol Debt Review (mandatory, from this revision forward)

**Every future protocol revision must include this section**, reviewing the previous
protocol's risks as: Closed / Remaining OPEN / New. This closes the risk that OPEN risks
silently disappear between revisions. What follows is this rule's first application, covering
the v3 risk surface (`BRIDGE.md`, `EXECUTION_LOG.md`, `EXECUTION_ALIGNMENT.md`,
`EXECUTION_CLOSURE.md`, and the prior chat-only v4 proposal).

**Closed by RC1:**
- Binding Rule rigidity (required an artifact unconditionally) — closed by the Binding Rule
  Update, above.
- Informal, undocumented Bootstrap Set — closed by `BOOTSTRAP.md`.
- "Architect Override" naming ambiguity — closed by renaming to Architect Clarification at
  first persistence.
- Risk of silently dropping OPEN risks across revisions — closed by making this Protocol Debt
  Review section itself mandatory.

**Remaining OPEN (not addressed by RC1):**
- `EXECUTION_CLOSURE.md`'s circular dependency risk: closing any Sprint step's Definition of
  DONE requires at least one BOUND execution, but zero of the 9 `EXECUTION_LOG.md` entries have
  ever been resolved to BOUND or ARCHIVED. RC1 does not retroactively resolve this backlog.
- No technical enforcement exists for any rule in this document (target-step declaration,
  commit policy, Binding Rule) — this remains a documentation-only protocol; nothing here adds
  tooling.
- The `PROMPT_TEMPLATE.md` / `REVIEW_FORMAT.md` ARP-shape duplication — flagged in the prior
  proposal, not in this task's mandatory scope, so not resolved in RC1.
- Bootstrap-B/C content is still not persisted to repository files (see Finding, below) — RC1
  only preserves the *finding*; writing that content to files is a separate, future task.

**New risks introduced by RC1:** see Risk Registry, below (items 1 and 2).

## Bootstrap B/C Finding (preserved)

One of the strongest findings of Sprint 04: substantial architecture work — the UI System
Design, the Component Architecture Blueprint, and the React Implementation Blueprint (with its
own Risk Registry and Failure Model) — was delivered entirely in conversation and **exists
nowhere in the repository**. See `EXECUTION_LOG.md` entries 5–7. This finding is the direct
justification for Repository-First Enforcement, above, and must remain visible in every future
revision of this protocol, not just this one.

## Risk Registry

| # | Risk | Status | Impact | Notes |
|---|---|---|---|---|
| 1 | **Task Bus Documentation Fragmentation** | OPEN | Medium | Growing number of `docs/task-bus/*` files risks becoming harder to keep consistent than the problem it solves. Mitigation: regular consolidation passes; this revision itself practices that by merging into `TASK_BUS_V4.md` and `EXECUTION_ALIGNMENT.md` rather than adding a file per rule. |
| 2 | **"No Artifact Required" escape hatch misuse** (new, introduced by the Binding Rule Update) | OPEN | Medium | Could be used to avoid persisting things that should be persisted, recreating the Bootstrap-B/C problem in a "sanctioned" way. Mitigation: the decision may only be made by the Architect, must be explicit, and must be recorded on the execution entry itself — never a default. |
| 3 | `EXECUTION_CLOSURE.md` circular dependency (carried forward, OPEN) | OPEN | Medium | See Protocol Debt Review, above. |
| 4 | No technical enforcement of any protocol rule (carried forward, OPEN) | OPEN | Low–Medium | Inherent to a documentation-only protocol; accepted as a standing limitation. |
| 5 | `PROMPT_TEMPLATE.md`/`REVIEW_FORMAT.md` ARP-shape duplication (carried forward, OPEN) | OPEN | Low | Not in RC1's mandatory scope. |
| 6 | Bootstrap-B/C content unpersisted (carried forward, OPEN) | OPEN | Medium | See Finding, above. Retroactive fix is a separate future task. |

## Protocol Evolution Summary

**Resolved since previous version (v3):** Binding Rule rigidity; informal Bootstrap Set;
Architect Override naming ambiguity; risk of silently dropping OPEN risks across revisions.

**Remaining risks:** `EXECUTION_CLOSURE.md` circular dependency; no technical enforcement;
`PROMPT_TEMPLATE`/`REVIEW_FORMAT` duplication; Bootstrap-B/C content unpersisted.

**New risks:** Task Bus Documentation Fragmentation; "No Artifact Required" escape-hatch misuse.
