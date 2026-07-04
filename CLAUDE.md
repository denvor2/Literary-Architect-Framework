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
- **Chief Software Architect** (ChatGPT) — architectural review, long-term technical direction.
- **Lead Software Engineer** (Claude) — implementation, documentation, risk-flagging.

## Documentation Hierarchy

Authoritative, in this order:

1. [README.md](README.md) — public product vision
2. [docs/project/PROJECT_CHARTER.md](docs/project/PROJECT_CHARTER.md) — mission, principles, scope
3. [docs/project/PROJECT_STATE.md](docs/project/PROJECT_STATE.md) — current snapshot
4. [docs/project/CURRENT_SPRINT.md](docs/project/CURRENT_SPRINT.md) — the sprint in progress
5. [docs/project/HANDOVER.md](docs/project/HANDOVER.md) — onboarding for a new session
6. [docs/project/DEVELOPMENT_WORKFLOW.md](docs/project/DEVELOPMENT_WORKFLOW.md) — process and roles
7. [docs/adr/](docs/adr/) — Architecture Decision Records
8. [docs/reports/](docs/reports/) — Sprint reports (history)

If a decision isn't recorded in one of these, it isn't decided — conversation history is not
authoritative (see `PROJECT_STATE.md`'s Source of Truth section).

## Evolutionary Architecture

Contracts are discovered from working examples, not designed upfront. Do not design a generic
abstraction (e.g. the Expert Contract) before a concrete implementation has validated it. See
[ADR-0002](docs/adr/ADR-0002-expert-contract-vision.md).

## How to Work Here

- Read [docs/project/HANDOVER.md](docs/project/HANDOVER.md) first in any new session — it has
  the full onboarding detail this file doesn't repeat.
- Think before coding; prefer the smallest validated step over a complete design; ask when a
  requirement is ambiguous rather than assuming.
- No unrequested functionality, abstractions, or scope expansion. Small commits.
- If implementation reveals that an earlier architectural assumption was wrong: stop, explain,
  propose alternatives, and wait for review — don't silently work around it.
- Architectural changes need an ADR under `docs/adr/` before they're considered final.
- Keep documentation synchronized with what's actually true in the repository — an
  inconsistency between docs is a defect, not a style issue.
