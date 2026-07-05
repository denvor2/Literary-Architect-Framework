# Task Bus — Sprint Bridge

## Purpose

Resolve the dual source-of-truth risk between the Sprint planning layer
([CURRENT_SPRINT.md](../project/CURRENT_SPRINT.md)) and the Task Bus execution layer
([CURRENT_STEP.md](../project/CURRENT_STEP.md)) by defining an explicit, one-directional
mapping between them. Neither system replaces the other.

## Layer Roles

- **Sprint system** (`docs/project/CURRENT_SPRINT.md`) is the **planning authority**. It
  defines what a sprint's steps *are*, their order, their scope, and when a step counts as
  done. It is never modified by Task Bus activity.
- **Task Bus** (`docs/task-bus/`, `docs/project/CURRENT_STEP.md`) is the **execution layer**. It
  defines how a single Sprint step is turned into one or more executable, reviewable units of
  work (Step Cards). It never defines new planning scope on its own.

## Mapping Rule

- Every Sprint step (`Sprint-<NN>-Step-<X>`, e.g. `Sprint-04-Step-02`) may be executed through
  one or more Task Bus steps, numbered `Sprint-<NN>-Step-<X>.<Y>` — e.g. `Sprint-04-Step-02.1`,
  `Sprint-04-Step-02.2`.
- `X` always identifies the Sprint planning step being executed. `Y` is the execution
  attempt/sub-step within it — incremented whenever a Step Card is re-run after a `FIX`, or a
  Sprint step naturally decomposes into more than one executable unit.
- A Sprint step in `CURRENT_SPRINT.md` is only marked `[x]` (done) once its highest-numbered
  mapped Task Bus step has received `STATUS: OK` under [REVIEW_FORMAT.md](REVIEW_FORMAT.md).
- `CURRENT_STEP.md`'s `id` MUST always be a valid `X.Y` under this scheme, resolving back to
  exactly one Sprint step `X`. A Task Bus step with no corresponding Sprint step is invalid
  under this bridge.

## Authority Rules

- `CURRENT_SPRINT.md` remains the sole planning authority: it defines the sprint's steps,
  their scope, and their order. Task Bus does not add, remove, or reorder Sprint steps.
- `CURRENT_STEP.md` is a **runtime pointer only** — it names which Task Bus step is executing
  right now and which Sprint step it belongs to. It carries no independent scope-defining
  authority.
- Task Bus never replaces the Sprint system. It is the execution mechanism *inside* a Sprint
  step, the same way [DEVELOPMENT_WORKFLOW.md](../project/DEVELOPMENT_WORKFLOW.md)'s
  Implementation stage sits inside the larger sprint cycle.

## Example

```
Sprint-04-Step-02        (CURRENT_SPRINT.md: "Create repository-level CLAUDE.md")
 └─ Sprint-04-Step-02.1  (Task Bus: first execution attempt)
 └─ Sprint-04-Step-02.2  (Task Bus: re-run after a FIX, if needed)
```

Once `Sprint-04-Step-02.2` receives `STATUS: OK`, `CURRENT_SPRINT.md` marks Step 2 `[x]`, and
`CURRENT_STEP.md` advances to `Sprint-04-Step-03.1`.

## Known Inconsistency (flagged, not resolved here)

`CURRENT_STEP.md` currently points to `id: Sprint-04-Step-03` — under this bridge's mapping
rule, that identifier is already non-conformant (it has no `.Y` execution-attempt suffix).
More significantly, the Bootstrap A/B/C work already executed and committed (application
tooling/branding, then UI, component, and React implementation architecture) does not
correspond to Sprint Step 3 — "Install the Anthropic SDK; `.env.example`; secrets convention"
— at all. That work has no matching entry anywhere in `CURRENT_SPRINT.md`'s Tasks list.

Because this task forbids modifying `CURRENT_SPRINT.md` or the existing Sprint 04 structure,
this gap is recorded here as an open risk rather than silently corrected. Resolving it —
whether by inserting a missing Sprint step to retroactively cover the Bootstrap work, or by
correcting `CURRENT_STEP.md`'s pointer — requires a Product Owner / Chief Software Architect
decision, not a unilateral fix inside this bridge document.
