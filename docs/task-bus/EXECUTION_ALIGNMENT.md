# Task Bus — Execution Alignment Layer

**Updated under [TASK_BUS_V4.md](TASK_BUS_V4.md) RC1** — the Binding Rule (§2) now accepts an
explicit "No Artifact Required" decision as an alternative to a repository artifact. See
`TASK_BUS_V4.md`'s Version Evolution table; this document remains the canonical, single home of
the Binding Rule and is not duplicated there.

Defines how [EXECUTION_LOG.md](EXECUTION_LOG.md) entries connect to Sprint steps
([CURRENT_SPRINT.md](../project/CURRENT_SPRINT.md)) going forward, building on the layer
roles and `X.Y` numbering already defined in [BRIDGE.md](BRIDGE.md). This document adds
alignment metadata only — it does not modify the Sprint system, the Task Bus runtime state, the
Bridge, or any existing Execution Log entry.

## 1. Mapping Rules

- **Eligibility.** A Sprint step becomes "eligible for execution mapping" only once it is the
  active step named in `CURRENT_SPRINT.md`'s Tasks list — i.e. the step currently in progress
  or next up. A future, not-yet-reached step is not eligible; a step already checked off is not
  retroactively eligible either.
- **Linking.** An Execution Log entry is linked to a Sprint step by setting its
  `linked_sprint_step` field to that step's identifier (`Sprint-<NN>-Step-<X>`, per `BRIDGE.md`'s
  `X.Y` scheme). This link is declared when the entry is created — not inferred or assigned
  after the fact by matching descriptions retroactively.
- **UNBOUND → BOUND transition.** An entry is UNBOUND by default at creation. It may transition
  to BOUND only once all three conditions in the Binding Rule (§2) are simultaneously satisfied,
  and that transition is itself recorded as an explicit, appended update to the entry — never a
  silent rewrite of its original record, consistent with `EXECUTION_LOG.md`'s "additive, never
  rewritten" principle.

## 2. Binding Rule

An execution entry may be marked **BOUND** only if, at the same time:

1. Its description matches the stated objective of one specific, named Sprint step in
   `CURRENT_SPRINT.md` — not merely "related to the sprint" in general.
2. **Either:**
   - it produced a **verifiable artifact**: a file that exists in the repository and can be
     pointed to (a conversational-only deliverable does not qualify on its own — this is what
     originally closed the gap `EXECUTION_LOG.md` exposed with the Bootstrap-B and
     Bootstrap-C-React-Blueprint entries); **or**
   - the Architect has made an explicit **"No Artifact Required"** decision for this entry —
     recorded on the entry itself, naming the Architect and the reason. Architecture reviews
     and research are allowed to end without generating files when this outcome is explicitly
     approved; it is never a default, and Claude may not declare it on its own behalf.
3. It has been reviewed via the ARP format and received `STATUS: OK` under
   [REVIEW_FORMAT.md](REVIEW_FORMAT.md).

All conditions must hold together. Matching a step's objective alone, or having an artifact (or
a "No Artifact Required" decision) alone, is not sufficient for BOUND status.

**Caution:** the "No Artifact Required" path exists to avoid forcing busywork documentation,
not to legitimize losing knowledge to conversation. Per Repository-First Enforcement
(`TASK_BUS_V4.md`), any execution that produces *reusable architectural knowledge* — as opposed
to a pure go/no-go investigation with nothing worth keeping — still requires an artifact. "No
Artifact Required" is for the latter case only, and the Architect's recorded reason should say
which case applies.

## 3. Current State Declaration

- As of this document, **all 9 entries in `EXECUTION_LOG.md` remain UNBOUND.**
- **No retroactive binding is performed or allowed by this document** — including entries that
  produced real, committed artifacts (e.g. Bootstrap-A, ADR-0003-Doc-Sync,
  AI-Bus-v3-Bootstrap). None of them were executed against an explicitly declared Sprint Step
  target at execution time (see §4), and none went through an ARP → `REVIEW_FORMAT.md` cycle
  scored against a named step objective. Reclassifying past entries as BOUND would require a
  separate, explicit decision — it is not an automatic consequence of defining this rule.

## 4. Future Behavior Rule

- Every future execution **MUST declare its target Sprint Step** (the specific
  `Sprint-<NN>-Step-<X>` it is executing against) at the time it is initiated — before work
  begins, not assigned afterward.
- An execution may remain UNBOUND only if it is **explicitly marked `exploratory: true`** at
  declaration time — for architecture spikes, research, or design exploration not yet tied to a
  committed Sprint step. Silent UNBOUND (no declared target and no exploratory label) is no
  longer permitted going forward.
- Exploratory executions are still logged in `EXECUTION_LOG.md` as before, but their entry must
  carry the `exploratory: true` marker rather than simply omitting a target.
