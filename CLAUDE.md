# CLAUDE.md

This file is loaded automatically at the start of every Claude Code session in this
repository. `apps/studio/CLAUDE.md` is separate and unrelated in purpose — it only carries
Next.js framework-version guardrails for that one application. This file carries project-wide
context and is not duplicated there.

## Project

**Literary Studio** — an AI-powered IDE for writers, not a chat-based writing tool. Specialist
AI Experts (Professional Roles) operate directly on a manuscript. Fiction is the first domain;
the architecture is designed to generalize to screenplays, non-fiction, articles, and technical
documentation. See [README.md](README.md).

## Roles

- **Product Owner** (Денис Воробьев) — product vision, priorities, scope approval.
- **Architect** — architectural review, long-term technical direction.
- **Programmer (Executor)** — implementation, documentation, risk-flagging.

Architect and Programmer (Executor) are roles, not fixed AI models — see
[PROJECT_CHARTER.md](docs/project/PROJECT_CHARTER.md)'s Role/Model Binding note. This file is
auto-loaded specifically by the Claude Code CLI, which is a fact about that tool's session
bootstrap, not a statement that the Programmer role is permanently bound to Claude.

## Subagents

Three project subagents formalize the roles above so work survives a single session running out
of budget (this has already happened once — Sprint 20-23 landed uncommitted-but-working when the
executing session hit its limit; a follow-up session recovered it). Defined in `.claude/agents/`:

| Situation | Subagent |
|---|---|
| A Step Card exists (in `pending/` or `active/`) and needs implementing | `step-executor` |
| An ARP is ready in `active/` and needs a verdict before commit | `architect-reviewer` |
| A roadmap line/idea has no Step Card yet | `sprint-planner` |

Rules for using them:

- **A subagent does not see this conversation.** Always pass the Step Card's id or file path
  (and, for `architect-reviewer`, the ARP's path too) explicitly in the prompt — plus enough
  background (which sprint, why now) that it doesn't have to guess. Do not assume "it'll figure
  it out."
- **Delegation does not relax the Stop Condition.** No subagent commits, pushes, or archives a
  card to `done/` — that stays a session/human action taken only after an explicit `STATUS: OK`,
  the same single point of accountability this project has used for every commit so far.
- **Don't wrap trivial edits in a Step Card + subagent** — a one-file, one-line fix is faster and
  clearer done directly.
- **A subagent that hits a genuine product ambiguity** (not a technical implementation choice)
  stops and reports it rather than guessing — the same "resolve technical ambiguity yourself,
  escalate product decisions" split already used throughout this project's history.

Two project skills support this workflow (`.claude/skills/`): `literary-studio-run` (how to
start/drive `apps/studio`) and `literary-studio-live-verify` (this project's standing
no-mocks verification technique, required by every Step Card's Validation section).

## Documentation Hierarchy

Authoritative, in this order:

1. [README.md](README.md)
2. [docs/project/PROJECT_CHARTER.md](docs/project/PROJECT_CHARTER.md)
3. [docs/project/PROJECT_STATE.md](docs/project/PROJECT_STATE.md)
4. [docs/project/CURRENT_SPRINT.md](docs/project/CURRENT_SPRINT.md)
5. [docs/project/HANDOVER.md](docs/project/HANDOVER.md)
6. [docs/project/DEVELOPMENT_WORKFLOW.md](docs/project/DEVELOPMENT_WORKFLOW.md)
7. [docs/adr/](docs/adr/)
8. [docs/reports/](docs/reports/)

If a decision isn't recorded here, it isn't decided — conversation history is not authoritative.

---

## 🚨 OUTPUT LANGUAGE RULE (SPRINT 06+)

All ARP outputs, logs, summaries, validation reports, and step descriptions
must be written in **Russian**.

Exceptions:
- Code blocks
- Identifiers (file names, variables, API routes)
- Technical symbols

This rule is mandatory unless explicitly overridden.

---

## Sprint Context

- Sprint 05: UI + Editor + AI integration + persistence (completed, UI stable)
- Sprint 06: Architecture refactor (Domain Model → Operation Layer → AI Bus v5)

IMPORTANT:
Sprint 06 does NOT introduce new user-facing features.
It restructures internal architecture while preserving identical UI behavior.

Any change that affects UI behavior is considered a violation unless explicitly approved.

---

## Evolutionary Architecture

Contracts are discovered from working examples, not designed upfront.

Do not design generic abstractions before they are validated by real usage.

See [ADR-0002](docs/adr/ADR-0002-expert-contract-vision.md).

---

## How to Work Here

- Read HANDOVER.md first in new sessions.
- Prefer smallest validated step over large redesign.
- Do not expand scope without explicit approval.
- If assumptions break: stop and escalate.
- Keep documentation synchronized with reality.

---

## Architecture Rule (SPRINT 06 CRITICAL)

During Sprint 06:

- UI must NOT directly evolve AI logic
- AI must NOT depend on UI state shape
- All AI calls should eventually pass through AI Bus v5
- Domain Model is the single source of truth for Book/Chapter/Scene

Temporary coupling is allowed only during migration steps — not as final state.