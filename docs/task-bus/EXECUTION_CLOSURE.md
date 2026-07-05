# Task Bus — Execution Closure Layer

Defines how an execution — and the Sprint step it serves — is considered **closed**,
completing the loop: Sprint (planning) → Task Bus (execution) → Execution Log (history) →
Alignment (binding rules) → **Closure** (completion + authority). This document only adds a
closure mechanism; it does not modify `CURRENT_SPRINT.md`, `CURRENT_STEP.md`, `BRIDGE.md`,
`EXECUTION_LOG.md`, or `EXECUTION_ALIGNMENT.md`, and it does not itself close or reclassify any
existing entry.

## 1. Definition of DONE (Sprint Step)

A Sprint step may be marked complete (`[x]` in `CURRENT_SPRINT.md`) only when **all** of the
following hold simultaneously:

1. At least one execution in `EXECUTION_LOG.md` is **mapped** to that step and is **BOUND**
   under [EXECUTION_ALIGNMENT.md](EXECUTION_ALIGNMENT.md)'s Binding Rule.
2. Every artifact required by that step's stated Sprint objective exists in the repository —
   verifiable, not conversational.
3. Every execution mapped to that step has received `STATUS: OK` under
   [REVIEW_FORMAT.md](REVIEW_FORMAT.md).
4. No remaining active execution exists for that step — `CURRENT_STEP.md` is not currently
   pointing at an in-progress `X.Y` under it.

If any one of these is missing, the step remains open, regardless of how much visible work has
happened around it.

## 2. UNBOUND Resolution

Two transitions are allowed out of UNBOUND. No execution may remain permanently UNBOUND once
its outcome is known — UNBOUND is a valid *transient* state at creation (per
`EXECUTION_ALIGNMENT.md`), not a valid *permanent* one.

- **UNBOUND → BOUND** — only if a Sprint step match is explicitly declared retroactively *and*
  approved by the ARCHITECT. This is a deliberate, reviewed act, never automatic.
- **UNBOUND → ARCHIVED** — if the execution is confirmed exploratory, or confirmed unrelated to
  any Sprint step. Archiving is also explicit, not silent: an ARCHIVED entry keeps its full
  original record (per `EXECUTION_LOG.md`'s "additive, never rewritten" rule) and gains a
  closure annotation marking it intentionally out of scope, so it stops counting as
  "unresolved" against any step.

**This document does not itself apply either transition to the 9 existing entries.** It
defines the mechanism; using it — including on historical entries — is a separate, explicit
act for the ARCHITECT to perform, one entry at a time, not a bulk reclassification triggered by
this file's existence.

## 3. Sprint Update Rule

- A Sprint step can only be marked complete once the Definition of DONE (§1) is satisfied.
- **Authority**, following the existing three-role structure (see
  [PROJECT_CHARTER.md](../project/PROJECT_CHARTER.md)):
  - **Task Bus (Executor)** may *propose* that a step's Definition of DONE is satisfied — e.g. as
    part of an ARP — but never marks `CURRENT_SPRINT.md` complete itself, consistent with
    `BRIDGE.md`'s Authority Rules.
  - **ARCHITECT** verifies the Definition of DONE is actually met (mapped + BOUND execution,
    verifiable artifacts, ARP `OK`, no active execution remaining) and approves any
    UNBOUND → BOUND transitions needed to support it.
  - **Product Owner** holds final authority to mark the Sprint step complete in
    `CURRENT_SPRINT.md` (or delegate the mechanical edit).
  - Flow: **Task Bus proposes → Architect verifies and approves binding → Product Owner marks
    the step done.**

## 4. Consistency Rule

- `CURRENT_SPRINT.md` must never show a step as done while `EXECUTION_LOG.md` has any UNBOUND
  or not-yet-`OK` entry mapped, or plausibly mappable, to that step. If this ever occurs, it is
  a governance inconsistency to flag immediately — this document defines it as a violation; it
  has no mechanical enforcement yet (no tooling checks this automatically).
- An execution genuinely intended to satisfy a Sprint step's objective cannot sit UNBOUND
  indefinitely — it must resolve to BOUND or ARCHIVED (§2) before that step becomes eligible
  for the Definition of DONE (§1). A relevant-looking entry left UNBOUND is itself a signal
  that the step is not actually done, even if the surrounding work looks complete.
