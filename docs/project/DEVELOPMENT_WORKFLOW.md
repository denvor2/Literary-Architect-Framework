# Development Workflow

Literary Studio follows an evolutionary architecture process: decisions are captured close to
the work they govern, and documentation evolves together with working software rather than
being written up front and then abandoned.

## Process

```
Idea
  ↓
Planning        (Product Owner scopes intent; Architect considers direction)
  ↓
ADR             (architectural decisions recorded — before implementation when the decision
                 can be made safely in the abstract, after implementation when it should be
                 discovered from a working example)
  ↓
Implementation  (Programmer (Executor) builds the smallest working slice)
  ↓
Architecture Review   (Product Owner + Architect review the result and its
                       documentation before it is committed)
  ↓
Commit
  ↓
Sprint Report   (docs/reports/SPRINT-NN.md — what was done, decided, deferred, and risked)
  ↓
Project State   (docs/project/PROJECT_STATE.md and CURRENT_SPRINT.md updated to match reality)
  ↓
Next Sprint  ──────────────────────────────────────────────────────────────┐
                                                                            ↓
                                                                          Idea
```

The loop closes deliberately: a sprint's outcome (what was learned, what's still open) is what
generates the next Idea — this is how the process stays evolutionary rather than following a
plan fixed at the start.

Documentation is not a separate phase that happens "later" — the Sprint Report and Project
State updates are part of the same sprint as the implementation they describe, and nothing is
committed until both the code (if any) and its documentation are reviewed together.

## Roles and Responsibilities

### Product Owner

- Owns product vision, priorities, and scope decisions.
- Approves what enters a sprint and confirms when a sprint's Definition of Done is met.
- Provides context that originates outside the repository (e.g. product/business decisions)
  and ensures it eventually gets backfilled into `docs/`.

### Architect

- Owns architectural direction and long-term technical coherence across sprints.
- Leads Architecture Review passes: checking that ADRs, reports, and project docs are
  consistent, correctly scoped, and don't contradict each other.
- Decides when a decision is safe to make upfront (ADR before implementation) versus when it
  should be discovered from a working example (ADR after implementation).

### Programmer (Executor)

- Implements the smallest working slice that validates a decision.
- Proposes architectural options and trade-offs; writes ADRs, sprint reports, and keeps
  project-level documentation (`docs/project/`) in sync with reality.
- Flags risks and inconsistencies rather than letting them accumulate silently.

## Decision Levels

Not every decision needs the same ceremony. Roughly, from broadest to narrowest:

1. **Project** — mission, vision, scope (`docs/project/PROJECT_CHARTER.md`).
2. **Architecture** — recorded as an ADR (`docs/adr/`).
3. **Sprint** — scope and priorities for the current sprint (`docs/project/CURRENT_SPRINT.md`).
4. **Implementation** — day-to-day choices within an already-decided scope, made by whoever is
   implementing.

## Repository Rule

> If knowledge exists only in conversation, it does not yet belong to the project.

## AI Collaboration

AI proposes. Humans decide. The repository remembers.

## Notes

- Evolutionary architecture does not mean "no architecture" — it means contracts are earned by
  surviving contact with a real implementation (see
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md)) rather than designed speculatively.
- Every sprint should leave `docs/project/PROJECT_STATE.md`,
  [CURRENT_SPRINT.md](CURRENT_SPRINT.md), and the relevant `docs/reports/SPRINT-NN.md` in sync
  with what actually happened — a new session should be able to read
  [HANDOVER.md](HANDOVER.md) and continue without needing prior conversation history.
