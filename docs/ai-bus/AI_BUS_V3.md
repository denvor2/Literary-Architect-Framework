------------------------------------
Superseded by AI_BUS_V4.md.

This document is retained for historical reference only and is no longer the active operating
protocol.
------------------------------------

# AI Bus v3

## Execution System Overview

AI Bus v3 is the step-level execution protocol layered on top of Literary Studio's existing
development process (see [DEVELOPMENT_WORKFLOW.md](../project/DEVELOPMENT_WORKFLOW.md)). It
exists to make each unit of AI-assisted implementation work explicit, scoped, reviewable, and
traceable — one step at a time, rather than one sprint at a time.

## Roles

- **Human (Product Owner)** — approves each Step Card before execution and holds final
  authority over scope and commit.
- **ChatGPT (Chief Software Architect)** — reviews Claude's output against the active Step
  Card using [REVIEW_FORMAT.md](REVIEW_FORMAT.md), issuing `STATUS: OK / FIX / STOP`.
- **Claude (Lead Software Engineer / Executor)** — executes exactly one Step Card at a time
  using [PROMPT_TEMPLATE.md](PROMPT_TEMPLATE.md), produces an ARP, and commits only the
  approved scope.
- **Git** — the record of truth. A step is not considered done until its commit exists in
  history.

## Step-Based Execution Model

All work under AI Bus v3 is decomposed into Step Cards
([STEP_CARD_TEMPLATE.yml](STEP_CARD_TEMPLATE.yml)). A Step Card defines exactly one unit of
work: its objective, allowed/forbidden paths, inputs/outputs, validation rules, and
`done_when` criteria. Nothing is implemented beyond what the active Step Card describes.

## Single Active Step Rule

Exactly one Step Card is active at any time, tracked in
[docs/project/CURRENT_STEP.md](../project/CURRENT_STEP.md). A new step does not begin until
the active step's commit has been reviewed and the review's `NEXT STEP` has been confirmed.
This mirrors the "One Architecture Task → One Commit → One Review Package" discipline already
established earlier in Sprint 04.

## Deterministic Flow

```
Step → Prompt → Execute → Commit → Review → Next Step
```

1. **Step** — the active Step Card is defined/selected; `CURRENT_STEP.md` points to it.
2. **Prompt** — the Step Card is turned into an execution prompt for Claude, using
   `PROMPT_TEMPLATE.md`.
3. **Execute** — Claude implements exactly the Step Card's scope, nothing more.
4. **Commit** — Claude commits the step's change as a single atomic commit and produces an
   ARP.
5. **Review** — ChatGPT reviews the ARP and diff using `REVIEW_FORMAT.md`, returning
   `STATUS: OK / FIX / STOP`.
6. **Next Step** — on `OK`, `CURRENT_STEP.md` advances to the next step; on `FIX`, the same
   step is corrected; on `STOP`, execution halts for a human decision.

This flow does not replace `DEVELOPMENT_WORKFLOW.md` — it is the step-level mechanism inside
that cycle's Implementation and Architecture Review stages.
