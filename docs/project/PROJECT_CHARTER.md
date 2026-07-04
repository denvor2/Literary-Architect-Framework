# Literary Studio — Project Charter

## Mission

Give every writer access to a full editorial team, on demand, working directly inside their
manuscript.

## Vision

Literary Studio is an AI-powered IDE for writers — not a chat window bolted onto a blank page.
Specialist AI Experts (Professional Roles such as Line Editor, Developmental Editor, Style
Editor, Continuity Checker, Fact Checker, and Research Assistant) operate on the manuscript
itself, hold context across the whole project, and are each scoped to one editorial
responsibility. Fiction is the first domain built for; the Expert system is designed to
generalize to screenplays, non-fiction, articles, and technical documentation over time. See
[docs/vision/roadmap.md](../vision/roadmap.md).

## Project Scope

Literary Studio intentionally does not try to become:

- A general-purpose chatbot unrelated to manuscript work.
- A word processor competing on formatting features.
- A content-distribution platform in its own right — publishing integrations (Phase 3) are
  export targets, not a competing platform.

## Core Principles

- AI augments the author, never replaces them.
- Architecture before features.
- Experts are modular.
- Evolutionary architecture — contracts are discovered from working examples, not designed
  upfront.
- Human review remains central.
- Security by design.

## Quality Values

In priority order: **Maintainability, Simplicity, Correctness, Extensibility, Performance.**
When these trade off against each other, the earlier value wins.

## Current Non-Goals (Phase 1)

Explicitly out of scope for the MVP — see [docs/vision/roadmap.md](../vision/roadmap.md) for
when they become in-scope:

- Authentication / user accounts
- Plugins
- Marketplace
- Mobile app
- Cloud deployment

## Roles

- **Product Owner** (Денис Воробьев) — owns product vision, priorities, and approval of scope.
- **Chief Software Architect** (ChatGPT) — owns architectural review and long-term technical
  direction.
- **Lead Software Engineer** (Claude) — implements, proposes architectural options, writes and
  maintains documentation, raises risks.

## Decision Process

1. An idea or need is identified (Product Owner or Chief Software Architect).
2. Non-trivial architectural decisions are captured as an ADR under `docs/adr/` — proposed
   before or discovered after implementation, per the evolutionary architecture principle.
3. Documentation is reviewed (Architecture Review) before being committed.
4. The Product Owner approves scope and sequencing; the Chief Software Architect approves
   architectural direction; the Lead Software Engineer implements and flags trade-offs.

See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for the full process.

## Architecture Authority

A significant architectural change is not final until it references an existing ADR or creates
a new one under `docs/adr/`. If a decision only exists in conversation or code, it is not yet
part of the project — see the Repository Rule in
[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

## Definition of Done

A unit of work (feature, ADR, sprint) is done when:

- It matches the scope agreed with the Product Owner — no unrequested functionality.
- Any architectural decision it depends on is recorded (ADR) or explicitly deferred with a
  stated reason.
- Documentation affected by the change is updated in the same pass, not left stale.
- It has been reviewed (Architecture Review for documentation/architecture; manual
  verification for running code) before being committed.

## Development Philosophy

Optimize for a project that evolves correctly over years, not for short-term speed. Prefer
simple, validated solutions over speculative abstractions. Let working examples inform
architecture rather than designing architecture in the abstract. Keep the repository itself as
the project's source of truth, rather than relying on context that lives only in conversation.

## Success Metrics

High-level indicators, not sprint-level KPIs:

- A writer can complete a full editorial pass using at least one Expert without leaving the
  Studio App.
- Once ratified, the Expert Contract supports adding a new Expert without core architecture
  changes.
- A new session (human or AI) can onboard from the repository alone — see
  [HANDOVER.md](HANDOVER.md) — without needing prior conversation history.

## Project Motto

*Where craft meets architecture.*
